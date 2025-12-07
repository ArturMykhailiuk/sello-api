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
}).unknown(true); // Дозволяємо додаткові динамічні поля з formConfig

const updateAIWorkflowSchema = Joi.object({
  name: Joi.string().min(3).max(100).messages({
    "string.base": "name must be a string",
    "string.min": "name must be at least 3 characters long",
    "string.max": "name must be at most 100 characters long",
  }),
  systemPrompt: Joi.string().min(10).max(5000).messages({
    "string.base": "systemPrompt must be a string",
    "string.min": "systemPrompt must be at least 10 characters long",
    "string.max": "systemPrompt must be at most 5000 characters long",
  }),
})
  .unknown(true)
  .min(1); // Дозволяємо динамічні поля, мінімум одне поле required

const generatePromptSchema = Joi.object({
  assistantType: Joi.string().min(1).max(100).required().messages({
    "any.required": "assistantType is required",
    "string.base": "assistantType must be a string",
    "string.min": "assistantType cannot be empty",
    "string.max": "assistantType must be at most 100 characters long",
  }),
  serviceId: Joi.number().integer().positive().required().messages({
    "any.required": "serviceId is required",
    "number.base": "serviceId must be a number",
    "number.integer": "serviceId must be an integer",
    "number.positive": "serviceId must be positive",
  }),
});

export const aiWorkflowsSchemas = {
  createAIWorkflowSchema,
  updateAIWorkflowSchema,
  generatePromptSchema,
};
