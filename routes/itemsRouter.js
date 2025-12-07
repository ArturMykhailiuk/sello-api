import { Router } from "express";
import { itemsControllers } from "../controllers/itemsControllers.js";
import { validateQueryString } from "../middlewares/validateQueryString.js";
import { validateBody } from "../middlewares/validateBody.js";
import { authenticate } from "../middlewares/authenticate.js";
import {
  getAllItemsQueryStringSchema,
  createItemSchema,
} from "../schemas/itemsSchemas.js";

const itemsRouter = Router();

itemsRouter.get(
  "/",
  validateQueryString(getAllItemsQueryStringSchema),
  itemsControllers.getAllItems
);

itemsRouter.post(
  "/",
  authenticate,
  validateBody(createItemSchema),
  itemsControllers.createItem
);

export { itemsRouter };
