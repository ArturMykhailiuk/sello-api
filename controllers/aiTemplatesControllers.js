import { AITemplate } from "../db/sequelize.js";
import { ctrlWrapper } from "../helpers/ctrlWrapper.js";

/**
 * Get all AI templates
 * GET /api/ai-templates
 */
const getAllAITemplates = ctrlWrapper(async (req, res) => {
  const templates = await AITemplate.findAll({
    attributes: ["id", "name", "createdAt", "updatedAt"],
    order: [["name", "ASC"]],
  });

  res.json({ templates });
});

/**
 * Get AI template by ID (including full template JSON)
 * GET /api/ai-templates/:id
 */
const getAITemplateById = ctrlWrapper(async (req, res) => {
  const { id } = req.params;

  const template = await AITemplate.findByPk(id);

  if (!template) {
    return res.status(404).json({ message: "AI template not found" });
  }

  res.json({ data: { template } });
});

export const aiTemplatesControllers = {
  getAllAITemplates,
  getAITemplateById,
};
