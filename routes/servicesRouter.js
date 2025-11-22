import express from "express";

import { validateQueryString } from "../middlewares/validateQueryString.js";
import { servicesControllers } from "../controllers/servicesControllers.js";
import { authenticate } from "../middlewares/authenticate.js";
import { identifyUser } from "../middlewares/identifyUser.js";
import { validateParams } from "../middlewares/validateParams.js";
import { validateBody } from "../middlewares/validateBody.js";
import { imageUpload } from "../middlewares/imageUpload.js";
import {
  updateFavoriteByIdSchema,
  getServicesQueryStringSchema,
  getServiceByIdParamsSchema,
  createServiceBodySchema,
  deleteServiceParamsSchema,
} from "../schemas/servicesSchemas.js";
import { paginationSchema } from "../schemas/commonSchemas.js";

export const servicesRouter = express.Router();

servicesRouter.get(
  "/",
  identifyUser,
  validateQueryString(getServicesQueryStringSchema),
  servicesControllers.getServices
);

servicesRouter.post(
  "/",
  authenticate,
  validateBody(createServiceBodySchema),
  imageUpload.single("thumb"),
  servicesControllers.createService
);

servicesRouter.get(
  "/popular",
  validateQueryString(paginationSchema),
  servicesControllers.getPopularServices
);

servicesRouter.get(
  "/favorites",
  authenticate,
  validateQueryString(paginationSchema),
  servicesControllers.getFavoriteServices
);

servicesRouter.get(
  "/:serviceId",
  identifyUser,
  validateParams(getServiceByIdParamsSchema),
  servicesControllers.getServiceById
);

servicesRouter.delete(
  "/:serviceId",
  authenticate,
  validateParams(deleteServiceParamsSchema),
  servicesControllers.deleteServiceById
);

servicesRouter.post(
  "/favorites/:serviceId",
  authenticate,
  validateParams(updateFavoriteByIdSchema),
  servicesControllers.addFavoriteService
);

servicesRouter.delete(
  "/favorites/:serviceId",
  authenticate,
  validateParams(updateFavoriteByIdSchema),
  servicesControllers.removeFavoriteService
);
