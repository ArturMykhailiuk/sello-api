import Joi from "joi";

const createAIWorkflowSchema = Joi.object({
  aiTemplateId: Joi.number().integer().positive().required().messages({
    "any.required": "aiTemplateId is required",
    "number.base": "aiTemplateId must be a number",
    "number.integer": "aiTemplateId must be an integer",
    "number.positive": "aiTemplateId must be positive",
  }),
  name: Joi.string().min(3).max(100).required().messages({
    "any.required": "name is required",
    "string.base": "name must be a string",
    "string.min": "name must be at least 3 characters long",
    "string.max": "name must be at most 100 characters long",
  }),
  systemPrompt: Joi.string().min(10).max(5000).required().messages({
    "any.required": "systemPrompt is required",
    "string.base": "systemPrompt must be a string",
    "string.min": "systemPrompt must be at least 10 characters long",
    "string.max": "systemPrompt must be at most 5000 characters long",
  }),
});

export const aiWorkflowsSchemas = {
  createAIWorkflowSchema,
};
