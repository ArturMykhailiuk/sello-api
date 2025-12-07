import express from "express";
import { aiWorkflowsControllers } from "../controllers/aiWorkflowsControllers.js";
import { authenticate } from "../middlewares/authenticate.js";
import { validateBody } from "../middlewares/validateBody.js";
import { aiWorkflowsSchemas } from "../schemas/aiWorkflowsSchemas.js";

const router = express.Router();

// Generate system prompt using n8n workflow
router.post(
  "/generate-prompt",
  authenticate,
  validateBody(aiWorkflowsSchemas.generatePromptSchema),
  aiWorkflowsControllers.generatePrompt
);

// Toggle AI workflow active status (MUST be before PATCH /:id)
router.patch(
  "/:id/toggle",
  authenticate,
  aiWorkflowsControllers.toggleAIWorkflow
);

// Update AI workflow
router.patch(
  "/:id",
  authenticate,
  validateBody(aiWorkflowsSchemas.updateAIWorkflowSchema),
  aiWorkflowsControllers.updateAIWorkflow
);

// Delete AI workflow
router.delete("/:id", authenticate, aiWorkflowsControllers.deleteAIWorkflow);

export default router;
