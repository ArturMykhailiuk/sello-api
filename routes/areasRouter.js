import { Router } from "express";
import { areasControllers } from "../controllers/areasControllers.js";
import { validateQueryString } from "../middlewares/validateQueryString.js";
import { validateBody } from "../middlewares/validateBody.js";
import {
  getAllAreasQueryStringSchema,
  createOrUpdateAreaBodySchema,
} from "../schemas/areasSchemas.js";

const areasRouter = Router();

areasRouter.get(
  "/",
  validateQueryString(getAllAreasQueryStringSchema),
  areasControllers.getAllAreas
);

areasRouter.post(
  "/",
  validateBody(createOrUpdateAreaBodySchema),
  areasControllers.createOrUpdateArea
);

export { areasRouter };
