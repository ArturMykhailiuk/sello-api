import { Router } from "express";
import { itemsControllers } from "../controllers/itemsControllers.js";
import { validateQueryString } from "../middlewares/validateQueryString.js";
import { getAllItemsQueryStringSchema } from "../schemas/itemsSchemas.js";

const itemsRouter = Router();

itemsRouter.get(
  "/",
  validateQueryString(getAllItemsQueryStringSchema),
  itemsControllers.getAllItems
);

export { itemsRouter };
