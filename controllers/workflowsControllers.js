import { ctrlWrapper } from "../helpers/ctrlWrapper.js";
import { HttpError } from "../helpers/HttpError.js";
import { n8nService } from "../services/n8nService.js";
import { User } from "../db/sequelize.js";

/**
 * POST /api/workflows/connect
 * Creates n8n account for the current user or connects to existing one
 */
const connectN8n = async (req, res) => {
  const userId = req.user.id;

  // Check if already connected in our database
  if (req.user.n8nEnabled) {
    return res.status(200).json({
      message: "n8n account already connected",
      data: {
        n8nEnabled: true,
      },
    });
  }

  try {
    // Split name into first and last name
    const fullName = req.user.name || "User";
    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0] || "User";
    const lastName = nameParts.slice(1).join(" ") || "";

    console.log("Connecting n8n user with:", {
      email: req.user.email,
      firstName,
      lastName,
    });

    // Create or find existing n8n user
    const { userId: n8nUserId, apiKey } = await n8nService.createN8nUser(
      req.user.email,
      firstName,
      lastName
    );

    console.log("n8n user connected successfully:", { n8nUserId });

    // Update user with n8n credentials using instance method
    const user = await User.findByPk(userId);
    user.n8nUserId = n8nUserId;
    user.n8nApiKey = apiKey; // Setter will encrypt this
    user.n8nEnabled = true;
    await user.save();

    res.status(200).json({
      message: "n8n account connected successfully",
      data: {
        n8nEnabled: true,
        n8nUserId,
      },
    });
  } catch (error) {
    console.error("Error in connectN8n:", error);
    throw error;
  }
};

/**
 * GET /api/workflows/status
 * Check if user exists in n8n and auto-connect if found
 */
const checkN8nStatus = async (req, res) => {
  const userId = req.user.id;

  // Already connected in our DB
  if (req.user.n8nEnabled) {
    return res.status(200).json({
      data: {
        n8nEnabled: true,
        autoConnected: false,
      },
    });
  }

  try {
    // Check if user exists in n8n by email
    const n8nUser = await n8nService.findUserByEmail(req.user.email);

    if (n8nUser) {
      // User exists in n8n but not connected in our DB - auto-connect
      console.log("Auto-connecting existing n8n user:", {
        email: req.user.email,
        n8nUserId: n8nUser.id,
      });

      // Get admin key (will be encrypted by the model)
      const adminKey = n8nService.getAdminKey();

      // Use instance method to ensure setters are called
      const user = await User.findByPk(userId);
      user.n8nUserId = n8nUser.id;
      user.n8nApiKey = adminKey; // Setter will encrypt this
      user.n8nEnabled = true;
      await user.save();

      return res.status(200).json({
        data: {
          n8nEnabled: true,
          autoConnected: true,
          n8nUserId: n8nUser.id,
        },
      });
    }

    // User doesn't exist in n8n
    return res.status(200).json({
      data: {
        n8nEnabled: false,
        autoConnected: false,
      },
    });
  } catch (error) {
    console.error("Error checking n8n status:", error);
    // If check fails, just return not enabled
    return res.status(200).json({
      data: {
        n8nEnabled: false,
        autoConnected: false,
      },
    });
  }
};

/**
 * GET /api/workflows
 * Get all workflows for the current user
 */
const getWorkflows = async (req, res) => {
  console.log("getWorkflows called for user:", {
    id: req.user.id,
    email: req.user.email,
    n8nEnabled: req.user.n8nEnabled,
    n8nApiKey: req.user.n8nApiKey ? "EXISTS" : "NULL",
    n8nUserId: req.user.n8nUserId,
  });

  if (!req.user.n8nEnabled || !req.user.n8nApiKey) {
    console.error("n8n not connected:", {
      n8nEnabled: req.user.n8nEnabled,
      hasApiKey: !!req.user.n8nApiKey,
    });
    throw HttpError(403, "n8n account not connected");
  }

  // Get all workflows from n8n
  const allWorkflows = await n8nService.getWorkflows(req.user.n8nApiKey);

  // Filter workflows: only show workflows created by this user
  const { WorkflowAITemplate } = await import("../db/sequelize.js");

  const userWorkflowIds = await WorkflowAITemplate.findAll({
    attributes: ["n8nWorkflowId"],
    where: { userId: req.user.id },
  });

  const userN8nWorkflowIds = new Set(
    userWorkflowIds.map((w) => w.n8nWorkflowId)
  );

  // Filter workflows to only include user's workflows
  const workflows = allWorkflows.filter((workflow) =>
    userN8nWorkflowIds.has(workflow.id)
  );

  res.status(200).json({
    data: { workflows },
  });
};

/**
 * GET /api/workflows/:id
 * Get workflow by ID
 */
const getWorkflowById = async (req, res) => {
  if (!req.user.n8nEnabled || !req.user.n8nApiKey) {
    throw HttpError(403, "n8n account not connected");
  }

  const { id } = req.params;

  // Check if user owns this workflow
  const { WorkflowAITemplate } = await import("../db/sequelize.js");

  const userWorkflow = await WorkflowAITemplate.findOne({
    where: {
      n8nWorkflowId: id,
      userId: req.user.id,
    },
  });

  if (!userWorkflow) {
    throw HttpError(403, "You don't have access to this workflow");
  }

  const workflow = await n8nService.getWorkflowById(req.user.n8nApiKey, id);

  res.status(200).json({
    data: { workflow },
  });
};

/**
 * POST /api/workflows/:id/execute
 * Execute a workflow
 */
const executeWorkflow = async (req, res) => {
  if (!req.user.n8nEnabled || !req.user.n8nApiKey) {
    throw HttpError(403, "n8n account not connected");
  }

  const { id } = req.params;
  const executionData = req.body;

  // Check if user owns this workflow
  const { WorkflowAITemplate } = await import("../db/sequelize.js");

  const userWorkflow = await WorkflowAITemplate.findOne({
    where: {
      n8nWorkflowId: id,
      userId: req.user.id,
    },
  });

  if (!userWorkflow) {
    throw HttpError(403, "You don't have access to this workflow");
  }

  const result = await n8nService.executeWorkflow(
    req.user.n8nApiKey,
    id,
    executionData
  );

  res.status(200).json({
    message: "Workflow execution started",
    data: result,
  });
};

/**
 * GET /api/workflows/:id/executions
 * Get executions for a workflow
 */
const getExecutions = async (req, res) => {
  if (!req.user.n8nEnabled || !req.user.n8nApiKey) {
    throw HttpError(403, "n8n account not connected");
  }

  const { id } = req.params;
  const { limit, status } = req.query;

  // Check if user owns this workflow
  const { WorkflowAITemplate } = await import("../db/sequelize.js");

  const userWorkflow = await WorkflowAITemplate.findOne({
    where: {
      n8nWorkflowId: id,
      userId: req.user.id,
    },
  });

  if (!userWorkflow) {
    throw HttpError(403, "You don't have access to this workflow");
  }

  const executions = await n8nService.getExecutions(req.user.n8nApiKey, id, {
    limit,
    status,
  });

  res.status(200).json({
    data: { executions },
  });
};

/**
 * GET /api/executions/:executionId
 * Get execution status by ID
 */
const getExecutionStatus = async (req, res) => {
  if (!req.user.n8nEnabled || !req.user.n8nApiKey) {
    throw HttpError(403, "n8n account not connected");
  }

  const { executionId } = req.params;

  const execution = await n8nService.getExecutionStatus(
    req.user.n8nApiKey,
    executionId
  );

  res.status(200).json({
    data: { execution },
  });
};

export const workflowsControllers = {
  connectN8n: ctrlWrapper(connectN8n),
  checkN8nStatus: ctrlWrapper(checkN8nStatus),
  getWorkflows: ctrlWrapper(getWorkflows),
  getWorkflowById: ctrlWrapper(getWorkflowById),
  executeWorkflow: ctrlWrapper(executeWorkflow),
  getExecutions: ctrlWrapper(getExecutions),
  getExecutionStatus: ctrlWrapper(getExecutionStatus),
};
