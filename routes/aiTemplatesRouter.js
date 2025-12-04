import express from "express";
import { aiTemplatesControllers } from "../controllers/aiTemplatesControllers.js";

const router = express.Router();

// Get all AI templates
router.get("/", aiTemplatesControllers.getAllAITemplates);

// Get AI template by ID
router.get("/:id", aiTemplatesControllers.getAITemplateById);

export default router;
