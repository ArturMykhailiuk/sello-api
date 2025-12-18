import {
  sequelize,
  UserFavoriteService,
  User,
  Service,
  Area,
  ServiceArea,
  Category,
  Item,
  ServiceItem,
  WorkflowAITemplate,
  AITemplate,
} from "../db/sequelize.js";
import { getOffset } from "../helpers/getOffset.js";
import { HttpError } from "../helpers/HttpError.js";
import { filesServices } from "./filesServices.js";

/**
 * Gets a list of services with filtering, sorting and pagination.
 * Can sort by popularity if `popular: true` flag is passed.
 *
 * @param {Object} options - Query parameters
 * @param {number} [options.categoryId] - Service category ID
 * @param {string} [options.itemId] - Item name to filter
 * @param {number} [options.areaId] - Origin region ID
 * @param {number} [options.ownerId] - Origin user ID
 * @param {number} [options.page=1] - Page number for pagination
 * @param {number} [options.limit=10] - Number of services per page
 * @param {string} [options.sort] - Sort by, such as 'title_ASC' or 'time_DESC'
 * @param {boolean} [options.popular=false] - If true, sort by number of fans
 *
 * @returns {Object} Result with array of services, number of pages, and current page
 */
const getServices = async (
  { categoryId, areaId, itemId, ownerId, page = 1, limit = 10 },
  user = null
) => {
  const where = {};
  const include = [
    { model: User, as: "owner", attributes: ["id", "name", "avatarURL"] },
    {
      model: Area,
      as: "areas",
      through: { attributes: [] },
      attributes: [
        "id",
        "name",
        "latitude",
        "longitude",
        "formattedAddress",
        "city",
        "country",
        "street",
      ],
    },
  ];

  if (categoryId) where.categoryId = categoryId;
  if (ownerId) where.ownerId = ownerId;

  // Filter by areaId using ServiceArea junction table
  if (areaId) {
    include[1].through = { where: { areaId }, attributes: [] };
    include[1].required = true;
  }

  if (itemId) {
    include.push({
      model: Item,
      as: "items",
      where: { id: itemId },
      through: { attributes: [] },
      attributes: [],
      required: true,
    });
  }

  if (user && user.id) {
    include.push({
      model: UserFavoriteService,
      as: "userFavoriteServices",
      where: { userId: user.id },
      attributes: ["userId"],
      required: false,
    });
  }

  const { rows, count } = await Service.findAndCountAll({
    where,
    attributes: [
      "id",
      "title",
      "description",
      "thumb",
      "createdAt",
      "updatedAt",
    ],
    include,
    limit: limit,
    offset: getOffset(page, limit),
    order: [["id", "DESC"]],
    distinct: true,
  });

  const services = rows.map((service) => {
    const { userFavoriteServices, ...otherData } = service.toJSON();

    return service.userFavoriteServices
      ? {
          ...otherData,
          isFavorite: service.userFavoriteServices.length > 0,
        }
      : otherData;
  });

  return { total: count, services };
};

/**
 * Gets a single service by search term.
 * Returns the service's items and fans.
 *
 * @param {number} serviceId
 * @returns {Object|null} The service found or null
 */
const getServiceById = async (serviceId, user) => {
  const service = await Service.findByPk(serviceId, {
    attributes: {
      exclude: ["ownerId", "categoryId"],
    },
    include: [
      {
        model: User,
        as: "owner",
        attributes: ["id", "name", "avatarURL"],
      },
      {
        model: Area,
        as: "areas",
        through: { attributes: [] },
        attributes: ["id", "name", "formattedAddress", "latitude", "longitude"],
      },
      {
        model: Category,
        as: "category",
        attributes: ["id", "name"],
      },
      {
        model: Item,
        as: "items",
        attributes: ["id", "name", "imgURL"],
        through: {
          as: "serviceItem",
          attributes: ["measure"],
        },
      },
      {
        model: WorkflowAITemplate,
        as: "aiWorkflows",
        attributes: [
          "id",
          "name",
          "systemPrompt",
          "webhookUrl",
          "isActive",
          "createdAt",
        ],
        include: [
          {
            model: AITemplate,
            as: "aiTemplate",
            attributes: ["id", "name"],
          },
        ],
      },
    ],
  });

  if (!service) throw HttpError(404, "Not found");

  const favorite = await (user
    ? UserFavoriteService.findOne({
        where: { userId: user?.id, serviceId: service.id },
      })
    : Promise.resolve(null));

  const serviceJSON = service.toJSON();

  return {
    ...serviceJSON,
    isFavorite: user ? !!favorite : undefined,
    items: serviceJSON.items.map(({ serviceItem, ...otherData }) => ({
      ...otherData,
      measure: serviceItem.measure,
    })),
  };
};

/**
 * Gets a list of popular services by number of fans.
 * Works via `getServices` with the `popular: true` flag.
 *
 * @param {Object} options - Pagination options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=10] - Number of services per page
 *
 * @returns {Object} Result with popular services
 */
const getPopularServices = async ({ page = 1, limit = 10 }) => {
  const [services, total] = await Promise.all([
    Service.findAll({
      attributes: [
        "id",
        "title",
        "description",
        "thumb",
        "createdAt",
        "updatedAt",
        [sequelize.fn("COUNT", sequelize.col("fans.id")), "favoritesCount"],
      ],
      include: [
        {
          model: User,
          as: "fans",
          attributes: [],
          through: {
            attributes: [],
            model: UserFavoriteService,
          },
        },
        {
          model: User,
          as: "owner",
          attributes: ["id", "name", "avatarURL"],
        },
      ],
      group: ["Service.id", "owner.id"],
      order: [
        [sequelize.literal('"favoritesCount"'), "DESC"],
        ["id", "DESC"],
      ],
      limit,
      offset: getOffset(page, limit),
      subQuery: false,
    }),
    Service.count(),
  ]);

  const popularServices = services.map((service) => {
    const { favoritesCount, ...otherData } = service.toJSON();
    return otherData;
  });

  return {
    total,
    popularServices,
  };
};

const addFavorite = async ({ userId, serviceId }) => {
  const service = await Service.findByPk(serviceId);

  if (!service) throw HttpError(404, "Service not found");

  await UserFavoriteService.findOrCreate({ where: { userId, serviceId } });
};

const removeFavorite = async ({ userId, serviceId }) => {
  const service = await Service.findByPk(serviceId);
  if (!service) throw HttpError(404, "Service not found");

  const count = await UserFavoriteService.destroy({
    where: { userId, serviceId },
  });

  if (count === 0) throw HttpError(404, "Service not found");
};

const getUserFavoriteServices = async (userId, settings) => {
  const { page = 1, limit = 10 } = settings;
  const offset = getOffset(page, limit);

  const { count, rows } = await Service.findAndCountAll({
    include: [
      {
        model: UserFavoriteService,
        as: "userFavoriteServices",
        where: { userId },
        attributes: [],
        required: true,
      },
      { model: User, as: "owner", attributes: ["id", "name", "avatarURL"] },
    ],
    attributes: [
      "id",
      "title",
      "description",
      "thumb",
      "createdAt",
      "updatedAt",
    ],
    offset,
    limit,
    order: [["id", "DESC"]],
  });

  return { total: count, favoriteServices: rows };
};

const createService = async ({ body, file, user }) => {
  if (!file) {
    throw HttpError(400, "No file uploaded");
  }

  const thumb = await filesServices.processServiceThumb(file);

  const { items, areaIds, "areaIds[]": areaIdsArray, ...otherData } = body;

  const serviceItems = JSON.parse(items).map(({ id, measure }) => ({
    itemId: id,
    measure,
  }));

  const service = await Service.create(
    {
      ...otherData,
      thumb,
      ownerId: user.id,
      serviceItems,
    },
    { include: [{ model: ServiceItem, as: "serviceItems" }] }
  );

  // Create ServiceArea junction records for multiple locations
  // Handle both areaIds and areaIds[] (from FormData)
  const areaIdsToUse = areaIdsArray || areaIds;

  if (
    areaIdsToUse &&
    (Array.isArray(areaIdsToUse) ? areaIdsToUse.length > 0 : areaIdsToUse)
  ) {
    const idsArray = Array.isArray(areaIdsToUse)
      ? areaIdsToUse
      : [areaIdsToUse];
    const serviceAreas = idsArray.map((areaId) => ({
      serviceId: service.id,
      areaId: parseInt(areaId),
    }));
    await ServiceArea.bulkCreate(serviceAreas);
  }

  return service;
};

const updateService = async ({ serviceId, body, file, user }) => {
  const transaction = await sequelize.transaction();

  try {
    const service = await Service.findByPk(serviceId, { transaction });
    if (!service) throw HttpError(404, "Service not found");
    if (service.ownerId !== user.id) throw HttpError(403);

    const updateData = { ...body };
    const { areaIds, "areaIds[]": areaIdsArray } = body;

    // Remove areaIds from updateData since it's not a direct field anymore
    delete updateData.areaIds;
    delete updateData["areaIds[]"];

    // Process new image if uploaded
    if (file) {
      const oldThumb = service.thumb;
      const newThumb = await filesServices.processServiceThumb(file);
      updateData.thumb = newThumb;
      // Remove old image after successful upload
      if (oldThumb) {
        await filesServices.removeFile(oldThumb);
      }
    }

    // Update areaIds via ServiceArea junction table
    // Handle both areaIds and areaIds[] (from FormData)
    const areaIdsToUse = areaIdsArray || areaIds;

    if (areaIdsToUse !== undefined) {
      // Delete existing ServiceArea records
      await ServiceArea.destroy({
        where: { serviceId },
        transaction,
      });

      // Create new ServiceArea records for multiple locations
      if (
        areaIdsToUse &&
        (Array.isArray(areaIdsToUse) ? areaIdsToUse.length > 0 : areaIdsToUse)
      ) {
        const idsArray = Array.isArray(areaIdsToUse)
          ? areaIdsToUse
          : [areaIdsToUse];
        const serviceAreas = idsArray.map((areaId) => ({
          serviceId,
          areaId: parseInt(areaId),
        }));
        await ServiceArea.bulkCreate(serviceAreas, { transaction });
      }
    }

    // Update items if provided
    if (body.items) {
      const serviceItems = JSON.parse(body.items).map(({ id, measure }) => ({
        itemId: id,
        measure,
      }));

      // Delete old items
      await ServiceItem.destroy({
        where: { serviceId },
        transaction,
      });

      // Create new items
      await ServiceItem.bulkCreate(
        serviceItems.map((item) => ({ ...item, serviceId })),
        { transaction }
      );

      delete updateData.items;
    }

    // Update service fields
    await service.update(updateData, { transaction });

    await transaction.commit();

    // Return updated service with associations
    return getServiceById(serviceId, user);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const deleteServiceById = async (serviceId, user) => {
  const transaction = await sequelize.transaction();

  const service = await Service.findByPk(serviceId, { transaction });
  if (!service) throw HttpError(404, "Service not found");
  if (service.ownerId !== user.id) throw HttpError(403);

  try {
    await filesServices.removeFile(service.thumb);
    await service.destroy({ transaction });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const servicesServices = {
  getServices,
  getServiceById,
  getPopularServices,
  addFavorite,
  removeFavorite,
  getUserFavoriteServices,
  createService,
  updateService,
  deleteServiceById,
};
