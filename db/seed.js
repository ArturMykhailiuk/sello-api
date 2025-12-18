import fs from "node:fs/promises";
import path from "node:path";

import { v4 as uuidv4 } from "uuid";

import { hashSecret } from "../helpers/hashing.js";
import {
  sequelize,
  Category,
  Service,
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

// Seeds

const seedCategories = async ({ transaction }) => {
  const data = await readRawSeedData("categories.json");
  return await Category.bulkCreate(
    data.map(({ name, thumb }) => ({ name, thumb })),
    { transaction }
  );
};

const seedServices = async ({
  rawUsers,
  createdUsers,
  categories,
  transaction,
}) => {
  const data = await readRawSeedData("services.json");

  const servicesToCreate = [];

  for (const {
    title,
    category,
    owner: { $oid },
    instructions,
    description,
    thumb,
    time,
  } of data) {
    const ownerId = findUserId($oid, rawUsers, createdUsers);
    if (!ownerId) continue;

    const categoryId =
      categories.find(({ name }) => name === category)?.id ?? null;
    if (!categoryId) continue;

    servicesToCreate.push({
      title,
      instructions,
      description,
      thumb,
      time: Number(time),
      ownerId,
      categoryId,
    });
  }

  await Service.bulkCreate(servicesToCreate, {
    include: [{ model: ServiceItem, as: "serviceItems" }],
    transaction,
  });
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

  const templatesToCreate = templates.map(({ name, ...aiTemplate }) => {
    // Base fields for all templates
    const baseFields = [
      {
        id: "name",
        type: "text",
        label: "Назва ассистента",
        placeholder: "наприклад, Асистент підтримки клієнтів",
        required: true,
        validation: {
          minLength: 3,
          maxLength: 100,
          errorMessage: "Name must be between 3 and 100 characters",
        },
      },
      {
        id: "systemPrompt",
        type: "textarea",
        label: "Системний промпт",
        placeholder:
          "Визначте роль і поведінку штучного інтелекту. Приклад: Ви — корисний асистент служби підтримки для маркетплейсу локальних послуг. Допомагайте клієнтам знаходити відповідних постачальників послуг, відповідайте на запитання про послуги та надавайте дружню підтримку.",
        required: true,
        rows: 6,
        validation: {
          minLength: 10,
          maxLength: 2000,
          errorMessage: "System prompt must be between 10 and 2000 characters",
        },
        hint: "The system prompt defines how your AI assistant will behave and respond to users.",
      },
    ];

    // Add Telegram token field for Telegram AI Bot
    const fields = [...baseFields];
    if (name === "Telegram AI Bot") {
      fields.push(
        {
          id: "telegramToken",
          type: "text",
          label: "Telegram Bot Token",
          placeholder: "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
          required: true,
          validation: {
            pattern: "^[0-9]+:[A-Za-z0-9_-]+$",
            errorMessage:
              "Invalid Telegram bot token format (expected: 123456:ABC-DEF...)",
          },
          hint: "Отримайте токен від @BotFather in Telegram",
        },
        {
          id: "telegramBotUsername",
          type: "text",
          label: "Telegram Bot Username",
          placeholder: "my_awesome_bot",
          required: true,
          validation: {
            pattern: "^[a-zA-Z0-9_]{5,32}$",
            errorMessage:
              "Invalid username format (5-32 characters, letters, numbers, underscores)",
          },
          hint: "Ім'я бота без @ (наприклад: my_bot)",
        }
      );
    }

    return {
      name,
      aiTemplate,
      formConfig: { fields },
    };
  });

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

  const transaction = await sequelize.transaction();

  try {
    const categories = await seedCategories({ transaction });
    const users = await seedUsers({ rawUsers, transaction });
    const aiTemplates = await seedAITemplates({ transaction });

    await seedServices({
      rawUsers,
      createdUsers: users,
      categories,
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
