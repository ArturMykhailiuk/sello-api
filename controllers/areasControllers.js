import { areasServices } from "../services/areasServices.js";
import { ctrlWrapper } from "../helpers/ctrlWrapper.js";

const getAllAreas = async (req, res) => {
  const { total, areas } = await areasServices.listAreas(req.query);

  res.status(200).json({ data: { total, areas } });
};

const createOrUpdateArea = async (req, res) => {
  const area = await areasServices.createOrUpdateArea(req.body);

  res.status(200).json({ data: { area } });
};

export const areasControllers = {
  getAllAreas: ctrlWrapper(getAllAreas),
  createOrUpdateArea: ctrlWrapper(createOrUpdateArea),
};
