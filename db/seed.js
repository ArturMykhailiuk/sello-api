import fs from "node:fs/promises";
import path from "node:path";

import { v4 as uuidv4 } from "uuid";

import { hashSecret } from "../helpers/hashing.js";
import {
  sequelize,
  Area,
  Category,
  Ingredient,
  Item,
  Service,
  Testimonial,
  User,
  ServiceItem,
  AITemplate,
} from "./sequelize.js";

const seedsDirPath = path.resolve("db", "data");

export const readRawSeedData = async (seedFileName) => {
  const filePath = path.join(seedsDirPath, seedFileName);
  const data = await fs.readFile(filePath);
  return JSON.parse(data);
};

const getRawUsers = async () => await readRawSeedData("users.json");

const findUserId = (rawId, rawUsers, createdUsers) => {
  const rawUser = rawUsers.find(({ _id: { $oid } }) => $oid === rawId);
  if (!rawUser) return null;
  return createdUsers.find(({ email }) => email === rawUser.email)?.id ?? null;
};

const getRawIngredients = async () => await readRawSeedData("ingredients.json");
const getRawItems = async () => await readRawSeedData("items.json");

const findIngredientId = (rawId, rawIngredients, createdIngredients) => {
  const rawIngredient = rawIngredients.find(({ _id }) => _id === rawId);
  if (!rawIngredient) return null;
  return (
    createdIngredients.find(({ name }) => name === rawIngredient.name)?.id ??
    null
  );
};
const findItemId = (rawId, rawItems, createdItems) => {
  const rawItem = rawItems.find(({ _id }) => _id === rawId);
  if (!rawItem) return null;
  return createdItems.find(({ name }) => name === rawItem.name)?.id ?? null;
};

// Seeds
const seedAreas = async ({ transaction }) => {
  const data = await readRawSeedData("areas.json");
  return await Area.bulkCreate(
    data.map(({ name }) => ({ name })),
    { transaction }
  );
};

const seedCategories = async ({ transaction }) => {
  const data = await readRawSeedData("categories.json");
  return await Category.bulkCreate(
    data.map(({ name, thumb }) => ({ name, thumb })),
    { transaction }
  );
};

const seedIngredients = async ({ rawIngredients, transaction }) => {
  return await Ingredient.bulkCreate(
    rawIngredients.map(({ name, desc, img }) => ({ name, desc, imgURL: img }), {
      transaction,
    })
  );
};

const seedItems = async ({ rawItems, transaction }) => {
  return await Item.bulkCreate(
    rawItems.map(({ name, desc, img }) => ({ name, desc, imgURL: img }), {
      transaction,
    })
  );
};

const seedServices = async ({
  rawUsers,
  createdUsers,
  areas,
  categories,
  createdItems,
  rawItems,
  transaction,
}) => {
  const data = await readRawSeedData("services.json");

  const servicesToCreate = [];

  for (const {
    title,
    category,
    owner: { $oid },
    area,
    instructions,
    description,
    thumb,
    time,
    items,
  } of data) {
    const ownerId = findUserId($oid, rawUsers, createdUsers);
    if (!ownerId) continue;

    const areaId = areas.find(({ name }) => name === area)?.id ?? null;
    if (!areaId) continue;

    const categoryId =
      categories.find(({ name }) => name === category)?.id ?? null;
    if (!categoryId) continue;

    const serviceItems = items
      .map(({ id, measure }) => ({
        itemId: findItemId(id, rawItems, createdItems),
        measure,
      }))
      .filter(({ itemId }) => !!itemId);

    servicesToCreate.push({
      title,
      instructions,
      description,
      thumb,
      time: Number(time),
      ownerId,
      areaId,
      categoryId,
      serviceItems,
    });
  }

  await Service.bulkCreate(servicesToCreate, {
    include: [{ model: ServiceItem, as: "serviceItems" }],
    transaction,
  });
};

const seedTestimonials = async ({ rawUsers, createdUsers, transaction }) => {
  const data = await readRawSeedData("testimonials.json");
  const testimonialsData = data
    .map(({ testimonial, owner: { $oid: ownerId } }) => ({
      testimonial,
      ownerId: findUserId(ownerId, rawUsers, createdUsers),
    }))
    .filter(({ ownerId }) => !!ownerId);
  return await Testimonial.bulkCreate(testimonialsData, { transaction });
};

const seedUsers = async ({ rawUsers, transaction }) => {
  const userData = await Promise.all(
    rawUsers.map(async ({ name, avatar, email }) => ({
      name,
      email,
      avatarURL: avatar,
      password: await hashSecret(uuidv4()),
    }))
  );

  return await User.bulkCreate(userData, { transaction });
};

const seedAITemplates = async ({ transaction }) => {
  const data = await readRawSeedData("aiTemplates.json");

  // data is now an array of templates
  const templates = Array.isArray(data) ? data : [data];

  const templatesToCreate = templates.map(({ name, ...aiTemplate }) => ({
    name,
    aiTemplate,
  }));

  // Delete existing templates first to avoid duplicates
  await AITemplate.destroy({ where: {}, transaction });

  const created = await AITemplate.bulkCreate(templatesToCreate, {
    transaction,
  });

  console.log(`Seeded ${created.length} AI templates`);

  return created;
};

const initDb = async () => {
  const rawUsers = await getRawUsers();
  const rawIngredients = await getRawIngredients();
  const rawItems = await getRawItems();

  const transaction = await sequelize.transaction();

  try {
    const areas = await seedAreas({ transaction });
    const categories = await seedCategories({ transaction });
    const ingredients = await seedIngredients({ rawIngredients, transaction });
    const items = await seedItems({ rawItems, transaction });
    const users = await seedUsers({ rawUsers, transaction });
    const aiTemplates = await seedAITemplates({ transaction });

    await seedTestimonials({ rawUsers, createdUsers: users, transaction });

    await seedServices({
      rawUsers,
      createdUsers: users,
      areas,
      categories,
      rawItems,
      createdItems: items,
      transaction,
    });

    await transaction.commit();
    console.log("Database seeded successfully!");
  } catch (error) {
    await transaction.rollback();
    console.error("Failed to seed database, rolled back.", error);
  }
};

initDb();
