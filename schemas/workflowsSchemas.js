import Joi from "joi";
import j2s from "joi-to-swagger";

/**
 * Schema for executing a workflow
 */
export const executeWorkflowSchema = Joi.object({
  data: Joi.object().optional().description("Data to pass to the workflow"),
}).optional();

export const { swagger: executeWorkflowSwagger } = j2s(executeWorkflowSchema);

/**
 * Response schemas
 */
const workflowSchema = Joi.object({
  id: Joi.string().example("workflow-id-123"),
  name: Joi.string().example("My Workflow"),
  active: Joi.boolean().example(true),
  nodes: Joi.array().optional(),
  connections: Joi.object().optional(),
  createdAt: Joi.string().optional(),
  updatedAt: Joi.string().optional(),
});

const connectN8nResponseSchema = Joi.object({
  message: Joi.string().example("n8n account connected successfully"),
  data: Joi.object({
    n8nEnabled: Joi.boolean().example(true),
  }),
});

export const { swagger: connectN8nResponseSwagger } = j2s(
  connectN8nResponseSchema
);

const workflowsResponseSchema = Joi.object({
  data: Joi.object({
    workflows: Joi.array().items(workflowSchema),
  }),
});

export const { swagger: workflowsResponseSwagger } = j2s(
  workflowsResponseSchema
);

const workflowResponseSchema = Joi.object({
  data: Joi.object({
    workflow: workflowSchema,
  }),
});

export const { swagger: workflowResponseSwagger } = j2s(workflowResponseSchema);

const executionSchema = Joi.object({
  id: Joi.string().example("execution-id-123"),
  workflowId: Joi.string().example("workflow-id-123"),
  status: Joi.string()
    .valid("running", "success", "error", "waiting")
    .example("success"),
  startedAt: Joi.string().optional(),
  stoppedAt: Joi.string().optional(),
  data: Joi.object().optional(),
});

const executeWorkflowResponseSchema = Joi.object({
  message: Joi.string().example("Workflow execution started"),
  data: executionSchema,
});

export const { swagger: executeWorkflowResponseSwagger } = j2s(
  executeWorkflowResponseSchema
);

const executionsResponseSchema = Joi.object({
  data: Joi.object({
    executions: Joi.array().items(executionSchema),
  }),
});

export const { swagger: executionsResponseSwagger } = j2s(
  executionsResponseSchema
);

const executionStatusResponseSchema = Joi.object({
  data: Joi.object({
    execution: executionSchema,
  }),
});

export const { swagger: executionStatusResponseSwagger } = j2s(
  executionStatusResponseSchema
);
