import express from "express";

import { workflowsControllers } from "../controllers/workflowsControllers.js";
import { authenticate } from "../middlewares/authenticate.js";
import { validateBody } from "../middlewares/validateBody.js";
import { executeWorkflowSchema } from "../schemas/workflowsSchemas.js";

export const workflowsRouter = express.Router();

// All routes require authentication
workflowsRouter.use(authenticate);

// Check n8n status and auto-connect if user exists
workflowsRouter.get("/status", workflowsControllers.checkN8nStatus);

// Connect n8n account
workflowsRouter.post("/connect", workflowsControllers.connectN8n);

// Get all workflows
workflowsRouter.get("/", workflowsControllers.getWorkflows);

// Get workflow by ID
workflowsRouter.get("/:id", workflowsControllers.getWorkflowById);

// Execute workflow
workflowsRouter.post(
  "/:id/execute",
  validateBody(executeWorkflowSchema),
  workflowsControllers.executeWorkflow
);

// Get workflow executions
workflowsRouter.get("/:id/executions", workflowsControllers.getExecutions);

// Get execution status by ID
workflowsRouter.get(
  "/executions/:executionId",
  workflowsControllers.getExecutionStatus
);
