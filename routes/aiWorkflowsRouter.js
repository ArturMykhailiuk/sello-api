import express from "express";
import { aiWorkflowsControllers } from "../controllers/aiWorkflowsControllers.js";
import { authenticate } from "../middlewares/authenticate.js";
import { validateBody } from "../middlewares/validateBody.js";
import { aiWorkflowsSchemas } from "../schemas/aiWorkflowsSchemas.js";

const router = express.Router();

// Delete AI workflow
router.delete("/:id", authenticate, aiWorkflowsControllers.deleteAIWorkflow);

// Toggle AI workflow active status
router.patch(
  "/:id/toggle",
  authenticate,
  aiWorkflowsControllers.toggleAIWorkflow
);

export default router;
