import { itemsServices } from "../services/itemsServices.js";
import { ctrlWrapper } from "../helpers/ctrlWrapper.js";

const getAllItems = async (req, res) => {
  const { items, total } = await itemsServices.listItems(req.query);

  res.status(200).json({ data: { total, items } });
};

export const itemsControllers = {
  getAllItems: ctrlWrapper(getAllItems),
};
