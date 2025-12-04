import axios from "axios";
import crypto from "crypto";

import { settings } from "../settings.js";
import { HttpError } from "../helpers/HttpError.js";

const N8N_BASE_URL = settings.n8nBaseUrl;
const N8N_ADMIN_KEY = settings.n8nAdminKey;

/**
 * Creates a new user in n8n and generates an API key for them
 * @param {string} email - User's email
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name (optional)
 * @returns {Promise<{userId: string, apiKey: string}>}
 */
/**
 * Creates a new user in n8n and returns admin API key for workflow management
 * Note: n8n doesn't allow creating API keys for other users via admin API,
 * so we'll use the admin key for all operations and track user by n8nUserId
 * @param {string} email - User's email
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name (optional)
 * @returns {Promise<{userId: string, apiKey: string}>}
 */
const createN8nUser = async (email, firstName, lastName = "") => {
  try {
    // First, check if user with this email already exists in n8n
    let existingUserId = null;
    try {
      const usersResponse = await axios.get(`${N8N_BASE_URL}/api/v1/users`, {
        headers: {
          "X-N8N-API-KEY": N8N_ADMIN_KEY,
        },
      });

      const usersData = usersResponse.data.data || usersResponse.data;
      const users = Array.isArray(usersData) ? usersData : [usersData];
      const existingUser = users.find((user) => user && user.email === email);

      if (existingUser) {
        existingUserId = existingUser.id;
        console.log(
          `n8n user already exists with email ${email}, using existing user ID:`,
          existingUserId
        );
      }
    } catch (error) {
      console.log(
        "Error checking existing users, will attempt to create:",
        error.message
      );
    }

    // If user exists, return existing userId with admin key
    if (existingUserId) {
      return {
        userId: existingUserId,
        apiKey: N8N_ADMIN_KEY,
      };
    }

    // Create new user in n8n - API expects an array of users
    const password = crypto.randomBytes(32).toString("hex");

    const userResponse = await axios.post(
      `${N8N_BASE_URL}/api/v1/users`,
      [
        {
          email,
          firstName,
          lastName,
          password,
          role: "global:member",
        },
      ],
      {
        headers: {
          "X-N8N-API-KEY": N8N_ADMIN_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    // n8n returns array of created users, get the first one
    const createdUser = Array.isArray(userResponse.data)
      ? userResponse.data[0]
      : userResponse.data;

    const userId = createdUser.user?.id || createdUser.id;

    console.log(`Created new n8n user with ID: ${userId}`);

    // Login as the new user to get their API key
    try {
      const loginResponse = await axios.post(
        `${N8N_BASE_URL}/api/v1/login`,
        {
          email,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Extract API key from login response
      // Note: This might be in different places depending on n8n version
      const userApiKey =
        loginResponse.data?.data?.apiKey ||
        loginResponse.data?.apiKey ||
        loginResponse.headers["x-n8n-api-key"];

      if (userApiKey) {
        console.log(`Successfully obtained API key for user ${userId}`);
        return {
          userId,
          apiKey: userApiKey,
        };
      }

      console.warn(
        `Could not obtain API key from login for user ${userId}, falling back to admin key`
      );
    } catch (loginError) {
      console.error(`Error logging in as new user:`, loginError.message);
      console.warn(`Falling back to admin key for user ${userId}`);
    }

    // Fallback: Return admin key if login failed
    // This maintains backward compatibility but should be avoided
    return {
      userId,
      apiKey: N8N_ADMIN_KEY,
    };
  } catch (error) {
    console.error("Error creating n8n user:", error.response?.data || error);

    // If error is "user already exists", try to find and return that user
    if (
      error.response?.status === 400 &&
      error.response?.data?.message?.includes("already")
    ) {
      try {
        const usersResponse = await axios.get(`${N8N_BASE_URL}/api/v1/users`, {
          headers: {
            "X-N8N-API-KEY": N8N_ADMIN_KEY,
          },
        });

        const usersData = usersResponse.data.data || usersResponse.data;
        const users = Array.isArray(usersData) ? usersData : [usersData];
        const existingUser = users.find((user) => user && user.email === email);

        if (existingUser) {
          console.log(
            `Found existing n8n user after create error:`,
            existingUser.id
          );
          return {
            userId: existingUser.id,
            apiKey: N8N_ADMIN_KEY,
          };
        }
      } catch (findError) {
        console.error("Error finding existing user:", findError);
      }
    }

    throw HttpError(
      500,
      error.response?.data?.message || "Failed to create n8n user"
    );
  }
};

/**
 * Get all workflows for the user
 * @param {string} apiKey - User's n8n API key
 * @returns {Promise<Array>}
 */
const getWorkflows = async (apiKey) => {
  try {
    const response = await axios.get(`${N8N_BASE_URL}/api/v1/workflows`, {
      headers: {
        "X-N8N-API-KEY": apiKey,
      },
    });

    return response.data.data || response.data;
  } catch (error) {
    console.error("Error fetching workflows:", error.response?.data || error);
    throw HttpError(
      error.response?.status || 500,
      error.response?.data?.message || "Failed to fetch workflows"
    );
  }
};

/**
 * Get workflow by ID
 * @param {string} apiKey - User's n8n API key
 * @param {string} workflowId - Workflow ID
 * @returns {Promise<Object>}
 */
const getWorkflowById = async (apiKey, workflowId) => {
  try {
    const response = await axios.get(
      `${N8N_BASE_URL}/api/v1/workflows/${workflowId}`,
      {
        headers: {
          "X-N8N-API-KEY": apiKey,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching workflow:", error.response?.data || error);
    throw HttpError(
      error.response?.status || 500,
      error.response?.data?.message || "Failed to fetch workflow"
    );
  }
};

/**
 * Execute a workflow
 * @param {string} apiKey - User's n8n API key
 * @param {string} workflowId - Workflow ID
 * @param {Object} data - Data to pass to the workflow
 * @returns {Promise<Object>}
 */
const executeWorkflow = async (apiKey, workflowId, data = {}) => {
  try {
    const response = await axios.post(
      `${N8N_BASE_URL}/api/v1/workflows/${workflowId}/execute`,
      data,
      {
        headers: {
          "X-N8N-API-KEY": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error executing workflow:", error.response?.data || error);
    throw HttpError(
      error.response?.status || 500,
      error.response?.data?.message || "Failed to execute workflow"
    );
  }
};

/**
 * Get executions for a workflow
 * @param {string} apiKey - User's n8n API key
 * @param {string} workflowId - Workflow ID
 * @param {Object} filters - Filters (limit, status, etc.)
 * @returns {Promise<Array>}
 */
const getExecutions = async (apiKey, workflowId, filters = {}) => {
  try {
    const params = {
      workflowId,
      limit: filters.limit || 20,
      ...filters,
    };

    const response = await axios.get(`${N8N_BASE_URL}/api/v1/executions`, {
      headers: {
        "X-N8N-API-KEY": apiKey,
      },
      params,
    });

    return response.data.data || response.data;
  } catch (error) {
    console.error("Error fetching executions:", error.response?.data || error);
    throw HttpError(
      error.response?.status || 500,
      error.response?.data?.message || "Failed to fetch executions"
    );
  }
};

/**
 * Get execution status by execution ID
 * @param {string} apiKey - User's n8n API key
 * @param {string} executionId - Execution ID
 * @returns {Promise<Object>}
 */
const getExecutionStatus = async (apiKey, executionId) => {
  try {
    const response = await axios.get(
      `${N8N_BASE_URL}/api/v1/executions/${executionId}`,
      {
        headers: {
          "X-N8N-API-KEY": apiKey,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error fetching execution status:",
      error.response?.data || error
    );
    throw HttpError(
      error.response?.status || 500,
      error.response?.data?.message || "Failed to fetch execution status"
    );
  }
};

/**
 * Find user by email in n8n
 * @param {string} email - User's email
 * @returns {Promise<Object|null>} User object or null if not found
 */
const findUserByEmail = async (email) => {
  try {
    const response = await axios.get(`${N8N_BASE_URL}/api/v1/users`, {
      headers: {
        "X-N8N-API-KEY": N8N_ADMIN_KEY,
      },
    });

    // n8n API might return object with data property or array directly
    const usersData = response.data.data || response.data;
    const users = Array.isArray(usersData) ? usersData : [usersData];

    const user = users.find((u) => u && u.email === email);

    return user || null;
  } catch (error) {
    console.error(
      "Error finding user by email:",
      error.response?.data || error.message
    );
    return null;
  }
};

/**
 * Get admin API key
 * @returns {string} Admin API key
 */
const getAdminKey = () => {
  return N8N_ADMIN_KEY;
};

/**
 * Create a new workflow in n8n
 * @param {string} apiKey - User's n8n API key
 * @param {Object} workflowData - Workflow configuration (name, nodes, connections, settings)
 * @returns {Promise<{id: string, webhookUrl: string, workflow: Object}>}
 */
const createWorkflow = async (apiKey, workflowData) => {
  try {
    console.log(
      "Creating workflow with data:",
      JSON.stringify(workflowData, null, 2)
    );

    const response = await axios.post(
      `${N8N_BASE_URL}/api/v1/workflows`,
      workflowData,
      {
        headers: {
          "X-N8N-API-KEY": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    const workflow = response.data;

    // Extract webhook URL from workflow nodes
    let webhookUrl = null;
    if (workflow.nodes) {
      const webhookNode = workflow.nodes.find(
        (node) =>
          node.type === "n8n-nodes-base.webhook" ||
          node.type === "@n8n/n8n-nodes-langchain.chatTrigger"
      );
      if (webhookNode) {
        if (webhookNode.type === "@n8n/n8n-nodes-langchain.chatTrigger") {
          // For chatTrigger, webhook URL format is: /webhook/{webhookId}/chat
          const webhookId = webhookNode.webhookId;
          webhookUrl = `${N8N_BASE_URL}/webhook/${webhookId}/chat`;
        } else if (webhookNode.webhookId) {
          // Regular webhook node - construct webhook URL based on n8n configuration
          const webhookPath =
            webhookNode.parameters?.path || webhookNode.webhookId;
          webhookUrl = `${N8N_BASE_URL}/webhook/${webhookPath}`;
        }
      }
    }

    console.log(`Created workflow with ID: ${workflow.id}`);

    return {
      id: workflow.id,
      webhookUrl,
      workflow,
    };
  } catch (error) {
    console.error("Error creating workflow:", error.response?.data || error);
    throw HttpError(
      error.response?.status || 500,
      error.response?.data?.message || "Failed to create workflow"
    );
  }
};

/**
 * Delete a workflow from n8n
 * @param {string} apiKey - User's n8n API key
 * @param {string} workflowId - Workflow ID to delete
 * @returns {Promise<boolean>}
 */
const deleteWorkflow = async (apiKey, workflowId) => {
  try {
    await axios.delete(`${N8N_BASE_URL}/api/v1/workflows/${workflowId}`, {
      headers: {
        "X-N8N-API-KEY": apiKey,
      },
    });

    console.log(`Deleted workflow with ID: ${workflowId}`);
    return true;
  } catch (error) {
    console.error("Error deleting workflow:", error.response?.data || error);
    throw HttpError(
      error.response?.status || 500,
      error.response?.data?.message || "Failed to delete workflow"
    );
  }
};

/**
 * Activate or deactivate a workflow in n8n
 * @param {string} apiKey - User's n8n API key
 * @param {string} workflowId - Workflow ID
 * @param {boolean} active - true to activate, false to deactivate
 * @returns {Promise<Object>}
 */
const activateWorkflow = async (apiKey, workflowId, active = true) => {
  try {
    // n8n uses PATCH on /activate endpoint
    const endpoint = active
      ? `${N8N_BASE_URL}/api/v1/workflows/${workflowId}/activate`
      : `${N8N_BASE_URL}/api/v1/workflows/${workflowId}/deactivate`;

    const response = await axios.post(
      endpoint,
      {},
      {
        headers: {
          "X-N8N-API-KEY": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      `${active ? "Activated" : "Deactivated"} workflow with ID: ${workflowId}`
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error activating/deactivating workflow:",
      error.response?.data || error
    );
    throw HttpError(
      error.response?.status || 500,
      error.response?.data?.message || "Failed to activate/deactivate workflow"
    );
  }
};

export const n8nService = {
  createN8nUser,
  findUserByEmail,
  getAdminKey,
  getWorkflows,
  getWorkflowById,
  executeWorkflow,
  getExecutions,
  getExecutionStatus,
  createWorkflow,
  deleteWorkflow,
  activateWorkflow,
};
