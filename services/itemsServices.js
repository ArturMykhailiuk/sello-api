import { Op } from "sequelize";

import { Item } from "../db/sequelize.js";
import { getOffset } from "../helpers/getOffset.js";

const listItems = async (query) => {
  const { page = 1, limit = 10, name } = query;
  const offset = getOffset(page, limit);

  const where = {};

  if (name) where.name = { [Op.iLike]: `%${name}%` };

  const { rows, count } = await Item.findAndCountAll({
    where,
    attributes: ["id", "name", "imgURL"],
    offset,
    limit,
    order: [["name", "ASC"]],
  });

  return { items: rows, total: count };
};

export const itemsServices = {
  listItems,
};
