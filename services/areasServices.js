import { Op } from "sequelize";

import { Area } from "../db/sequelize.js";
import { getOffset } from "../helpers/getOffset.js";

const listAreas = async (query) => {
  const { page = 1, limit = 10, name } = query;
  const offset = getOffset(page, limit);

  const where = {};

  if (name) where.name = { [Op.iLike]: `%${name}%` };

  const { rows, count } = await Area.findAndCountAll({
    where,
    offset,
    limit,
    order: [["name", "ASC"]],
  });

  return { areas: rows, total: count };
};

const createOrUpdateArea = async (locationData) => {
  const { name, latitude, longitude, formattedAddress, city, country, street } =
    locationData;

  // Шукаємо існуючу area за координатами або назвою
  let area = await Area.findOne({
    where: {
      [Op.or]: [
        { name },
        {
          latitude,
          longitude,
        },
      ],
    },
  });

  if (area) {
    // Оновлюємо існуючу area
    await area.update({
      name,
      latitude,
      longitude,
      formattedAddress,
      city,
      country,
      street,
    });
  } else {
    // Створюємо нову area
    area = await Area.create({
      name,
      latitude,
      longitude,
      formattedAddress,
      city,
      country,
      street,
    });
  }

  return area;
};

export const areasServices = {
  listAreas,
  createOrUpdateArea,
};
