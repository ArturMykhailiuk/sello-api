import express from "express";

import { validateQueryString } from "../middlewares/validateQueryString.js";
import { servicesControllers } from "../controllers/servicesControllers.js";
import { aiWorkflowsControllers } from "../controllers/aiWorkflowsControllers.js";
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
  updateServiceBodySchema,
  updateServiceParamsSchema,
  deleteServiceParamsSchema,
} from "../schemas/servicesSchemas.js";
import { aiWorkflowsSchemas } from "../schemas/aiWorkflowsSchemas.js";
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

servicesRouter.patch(
  "/:serviceId",
  authenticate,
  validateParams(updateServiceParamsSchema),
  validateBody(updateServiceBodySchema),
  imageUpload.single("thumb"),
  servicesControllers.updateService
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

// AI Workflows routes
servicesRouter.get(
  "/:serviceId/ai-workflows",
  identifyUser,
  aiWorkflowsControllers.getServiceAIWorkflows
);

servicesRouter.post(
  "/:serviceId/ai-workflows",
  authenticate,
  validateBody(aiWorkflowsSchemas.createAIWorkflowSchema),
  aiWorkflowsControllers.createAIWorkflow
);
