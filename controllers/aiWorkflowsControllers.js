import crypto from "crypto";
import { AITemplate, WorkflowAITemplate, Service } from "../db/sequelize.js";
import { ctrlWrapper } from "../helpers/ctrlWrapper.js";
import { HttpError } from "../helpers/HttpError.js";
import { n8nService } from "../services/n8nService.js";
import { encrypt } from "../helpers/encryption.js";

/**
 * Get all AI workflows for a specific service
 * GET /api/services/:serviceId/ai-workflows
 */
const getServiceAIWorkflows = ctrlWrapper(async (req, res) => {
  const { serviceId } = req.params;

  // Check if service exists
  const service = await Service.findByPk(serviceId);
  if (!service) {
    throw HttpError(404, "Service not found");
  }

  const workflows = await WorkflowAITemplate.findAll({
    where: { serviceId },
    include: [
      {
        model: AITemplate,
        as: "aiTemplate",
        attributes: ["id", "name"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  res.json({ workflows });
});

/**
 * Create a new AI workflow for a service
 * POST /api/services/:serviceId/ai-workflows
 * Body: { aiTemplateId, name, systemPrompt }
 */
const createAIWorkflow = ctrlWrapper(async (req, res) => {
  const { serviceId } = req.params;
  const {
    aiTemplateId,
    name,
    systemPrompt,
    telegramToken,
    telegramBotUsername,
    ...restFields
  } = req.body;

  // Validate required fields
  if (!aiTemplateId || !name || !systemPrompt) {
    throw HttpError(400, "aiTemplateId, name, and systemPrompt are required");
  }

  // Check if service exists
  const service = await Service.findByPk(serviceId);
  if (!service) {
    throw HttpError(404, "Service not found");
  }

  // Get AI template
  const aiTemplate = await AITemplate.findByPk(aiTemplateId);
  if (!aiTemplate) {
    throw HttpError(404, "AI template not found");
  }

  // Check if Telegram token is required (for Telegram AI Bot template)
  const isTelegramBot = aiTemplate.name === "Telegram AI Bot";
  if (isTelegramBot && !telegramToken) {
    throw HttpError(400, "telegramToken is required for Telegram AI Bot");
  }
  if (isTelegramBot && !telegramBotUsername) {
    throw HttpError(400, "telegramBotUsername is required for Telegram AI Bot");
  }

  // Extract bot username from token for Telegram bots
  let encryptedToken = null;
  if (isTelegramBot && telegramToken) {
    // Telegram token format: 123456789:ABCdefGHI...
    encryptedToken = encrypt(telegramToken);
  }

  // Clone the workflow template and substitute placeholders
  const workflowTemplate = JSON.parse(JSON.stringify(aiTemplate.aiTemplate));

  // Generate unique IDs
  const webhookId = crypto.randomBytes(16).toString("hex");
  const webhookPath = `service-${serviceId}-${webhookId}`;

  // Update webhook node (for AI Chat type)
  const webhookNode = workflowTemplate.nodes.find(
    (node) => node.type === "@n8n/n8n-nodes-langchain.chatTrigger"
  );
  if (webhookNode) {
    webhookNode.parameters.path = webhookPath;
    webhookNode.webhookId = webhookId;
  }

  // For Telegram bots, update Telegram nodes with credentials
  let telegramCredentialsId = null;
  if (isTelegramBot && telegramToken) {
    // Create Telegram credentials in n8n
    const apiKey = n8nService.getAdminKey();
    const credentialsName = `${
      telegramBotUsername || "bot"
    }_${serviceId}_${Date.now()}`;

    const { id: credId } = await n8nService.createTelegramCredentials(
      apiKey,
      telegramToken,
      credentialsName
    );

    telegramCredentialsId = credId;

    // Update all Telegram nodes to use the new credentials
    workflowTemplate.nodes.forEach((node) => {
      if (
        node.type === "n8n-nodes-base.telegram" ||
        node.type === "n8n-nodes-base.telegramTrigger"
      ) {
        node.credentials = {
          telegramApi: {
            id: credId,
            name: credentialsName,
          },
        };
      }
    });
  }

  // Replace {{systemPrompt}} and {{telegramToken}} placeholders in all nodes
  const replacePlaceholders = (obj) => {
    if (typeof obj === "string") {
      let result = obj.replace(/\{\{systemPrompt\}\}/g, systemPrompt);
      if (isTelegramBot && telegramToken) {
        result = result.replace(/\{\{telegramToken\}\}/g, telegramToken);
      }
      return result;
    }
    if (Array.isArray(obj)) {
      return obj.map(replacePlaceholders);
    }
    if (obj && typeof obj === "object") {
      const newObj = {};
      for (const key in obj) {
        newObj[key] = replacePlaceholders(obj[key]);
      }
      return newObj;
    }
    return obj;
  };

  workflowTemplate.nodes = replacePlaceholders(workflowTemplate.nodes);

  // Prepare clean workflow data for n8n API (only required fields)
  const cleanWorkflowData = {
    name: name,
    nodes: workflowTemplate.nodes,
    connections: workflowTemplate.connections,
    settings: workflowTemplate.settings,
  };

  // Create workflow in n8n
  const apiKey = n8nService.getAdminKey();
  const { id: n8nWorkflowId, webhookUrl } = await n8nService.createWorkflow(
    apiKey,
    cleanWorkflowData
  );

  // Activate the workflow
  await n8nService.activateWorkflow(apiKey, n8nWorkflowId, true);

  // For Telegram bots, register webhook with Telegram
  if (isTelegramBot && telegramToken && webhookUrl) {
    try {
      await n8nService.registerTelegramWebhook(telegramToken, webhookUrl);
      console.log(
        `Registered Telegram webhook for bot: ${telegramBotUsername}`
      );
    } catch (error) {
      console.error("Failed to register Telegram webhook:", error);
      // Don't fail the entire workflow creation if webhook registration fails
      // The user can try to re-activate the workflow later
    }
  }

  // Prepare database fields
  const dbFields = {
    userId: req.user.id,
    serviceId,
    aiTemplateId,
    name,
    systemPrompt,
    n8nWorkflowId,
    webhookUrl,
    isActive: true,
  };

  // Add Telegram-specific fields if applicable
  if (isTelegramBot && encryptedToken) {
    dbFields.telegramToken = encryptedToken;
    dbFields.telegramBotUsername = telegramBotUsername;
    dbFields.n8nCredentialsId = telegramCredentialsId;
  }

  // Save to database
  const workflowAI = await WorkflowAITemplate.create(dbFields);

  // Fetch with relations
  const createdWorkflow = await WorkflowAITemplate.findByPk(workflowAI.id, {
    include: [
      {
        model: AITemplate,
        as: "aiTemplate",
        attributes: ["id", "name"],
      },
    ],
  });

  res.status(201).json({ workflow: createdWorkflow });
});

/**
 * Delete an AI workflow
 * DELETE /api/ai-workflows/:id
 */
const deleteAIWorkflow = ctrlWrapper(async (req, res) => {
  const { id } = req.params;

  const workflow = await WorkflowAITemplate.findByPk(id);
  if (!workflow) {
    throw HttpError(404, "AI workflow not found");
  }

  // Delete from n8n
  try {
    const apiKey = n8nService.getAdminKey();

    // Delete Telegram webhook if this is a Telegram bot
    if (workflow.telegramToken) {
      try {
        const { decrypt } = await import("../helpers/encryption.js");
        const decryptedToken = decrypt(workflow.telegramToken);
        await n8nService.deleteTelegramWebhook(decryptedToken);
      } catch (webhookError) {
        console.error("Error deleting Telegram webhook:", webhookError);
      }
    }

    await n8nService.deleteWorkflow(apiKey, workflow.n8nWorkflowId);

    // Delete credentials if exists (for Telegram bots)
    if (workflow.n8nCredentialsId) {
      await n8nService.deleteCredentials(apiKey, workflow.n8nCredentialsId);
    }
  } catch (error) {
    console.error("Error deleting workflow from n8n:", error);
    // Continue with database deletion even if n8n deletion fails
  }

  // Delete from database
  await workflow.destroy();

  res.json({ message: "AI workflow deleted successfully" });
});

/**
 * Toggle AI workflow active status
 * PATCH /api/ai-workflows/:id/toggle
 */
const toggleAIWorkflow = ctrlWrapper(async (req, res) => {
  const { id } = req.params;

  const workflow = await WorkflowAITemplate.findByPk(id);
  if (!workflow) {
    throw HttpError(404, "AI workflow not found");
  }

  // Toggle active status in n8n
  const newActiveStatus = !workflow.isActive;
  const apiKey = n8nService.getAdminKey();
  await n8nService.activateWorkflow(
    apiKey,
    workflow.n8nWorkflowId,
    newActiveStatus
  );

  // For Telegram bots, register/delete webhook
  if (workflow.telegramToken) {
    try {
      const { decrypt } = await import("../helpers/encryption.js");
      const decryptedToken = decrypt(workflow.telegramToken);

      if (newActiveStatus && workflow.webhookUrl) {
        // Register webhook when activating
        await n8nService.registerTelegramWebhook(
          decryptedToken,
          workflow.webhookUrl
        );
        console.log(`Registered Telegram webhook for workflow ${workflow.id}`);
      } else if (!newActiveStatus) {
        // Delete webhook when deactivating
        await n8nService.deleteTelegramWebhook(decryptedToken);
        console.log(`Deleted Telegram webhook for workflow ${workflow.id}`);
      }
    } catch (webhookError) {
      console.error("Error managing Telegram webhook:", webhookError);
      // Don't fail the entire toggle operation
    }
  }

  // Update in database
  if (newActiveStatus) {
    await workflow.activate();
  } else {
    await workflow.deactivate();
  }

  // Fetch updated workflow with relations
  const updatedWorkflow = await WorkflowAITemplate.findByPk(id, {
    include: [
      {
        model: AITemplate,
        as: "aiTemplate",
        attributes: ["id", "name"],
      },
    ],
  });

  res.json({ workflow: updatedWorkflow });
});

/**
 * Update an AI workflow
 * PATCH /api/ai-workflows/:id
 * Body: { name?, systemPrompt?, ...dynamicFields }
 */
const updateAIWorkflow = ctrlWrapper(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  console.log("=== UPDATE WORKFLOW ===");
  console.log("ID:", id);
  console.log("Update Data:", updateData);
  console.log("User ID:", req.user?.id);

  // Find workflow
  const workflow = await WorkflowAITemplate.findByPk(id, {
    include: [
      {
        model: AITemplate,
        as: "aiTemplate",
      },
    ],
  });

  if (!workflow) {
    throw HttpError(404, "AI workflow not found");
  }

  console.log("Found workflow:", {
    id: workflow.id,
    userId: workflow.userId,
    name: workflow.name,
    systemPrompt: workflow.systemPrompt?.substring(0, 50) + "...",
  });

  // Check ownership
  if (workflow.userId !== req.user.id) {
    throw HttpError(403, "You don't have permission to update this workflow");
  }

  // If systemPrompt or name is updated, we need to update the n8n workflow
  const needsN8nUpdate =
    (updateData.systemPrompt &&
      updateData.systemPrompt !== workflow.systemPrompt) ||
    (updateData.name && updateData.name !== workflow.name);

  if (needsN8nUpdate) {
    console.log("Workflow data changed, updating n8n workflow...");
    try {
      // Get current workflow from n8n
      const apiKey = n8nService.getAdminKey();
      console.log("Fetching workflow from n8n, ID:", workflow.n8nWorkflowId);
      const n8nWorkflow = await n8nService.getWorkflowById(
        apiKey,
        workflow.n8nWorkflowId
      );

      console.log("Got n8n workflow, updating...");

      let updatedNodes = n8nWorkflow.nodes;

      // Replace systemPrompt in all nodes if it changed
      if (
        updateData.systemPrompt &&
        updateData.systemPrompt !== workflow.systemPrompt
      ) {
        const replaceSystemPrompt = (obj, oldPrompt, newPrompt) => {
          if (typeof obj === "string") {
            return obj.replace(
              new RegExp(oldPrompt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
              newPrompt
            );
          }
          if (Array.isArray(obj)) {
            return obj.map((item) =>
              replaceSystemPrompt(item, oldPrompt, newPrompt)
            );
          }
          if (obj && typeof obj === "object") {
            const newObj = {};
            for (const key in obj) {
              newObj[key] = replaceSystemPrompt(obj[key], oldPrompt, newPrompt);
            }
            return newObj;
          }
          return obj;
        };

        updatedNodes = replaceSystemPrompt(
          n8nWorkflow.nodes,
          workflow.systemPrompt,
          updateData.systemPrompt
        );
      }

      console.log("Sending update to n8n...");
      // Update workflow in n8n
      await n8nService.updateWorkflow(apiKey, workflow.n8nWorkflowId, {
        name: updateData.name || workflow.name, // Use new name if provided
        nodes: updatedNodes,
        connections: n8nWorkflow.connections,
        settings: n8nWorkflow.settings,
      });

      console.log("N8n workflow updated successfully");

      // If workflow is active, deactivate and reactivate to apply changes
      if (workflow.isActive) {
        console.log("Reactivating workflow...");
        await n8nService.activateWorkflow(
          apiKey,
          workflow.n8nWorkflowId,
          false
        );
        await n8nService.activateWorkflow(apiKey, workflow.n8nWorkflowId, true);
      }
    } catch (error) {
      console.error("Error updating n8n workflow:", error);
      console.error("Error details:", error.response?.data || error.message);
      throw HttpError(500, "Failed to update workflow in n8n");
    }
  }

  console.log("Updating database record...");
  // Update database record
  await workflow.update(updateData);

  console.log("Fetching updated workflow...");
  // Fetch updated workflow with relations
  const updatedWorkflow = await WorkflowAITemplate.findByPk(id, {
    include: [
      {
        model: AITemplate,
        as: "aiTemplate",
        attributes: ["id", "name"],
      },
    ],
  });

  console.log("Update successful!");
  res.json({ workflow: updatedWorkflow });
});

/**
 * Generate system prompt using n8n workflow
 * POST /api/ai-workflows/generate-prompt
 * Body: { assistantType, serviceId }
 */
const generatePrompt = ctrlWrapper(async (req, res) => {
  const { assistantType, serviceId } = req.body;

  // Check if service exists
  const service = await Service.findByPk(serviceId);
  if (!service) {
    throw HttpError(404, "Service not found");
  }

  // Get the prompt generation webhook URL from environment or settings
  const promptGenerationWebhook = process.env.N8N_PROMPT_GENERATION_WEBHOOK;

  if (!promptGenerationWebhook) {
    throw HttpError(
      500,
      "Prompt generation workflow is not configured. Please set N8N_PROMPT_GENERATION_WEBHOOK environment variable."
    );
  }

  // Call n8n workflow to generate system prompt
  const systemPrompt = await n8nService.generateSystemPrompt(
    promptGenerationWebhook,
    assistantType,
    serviceId
  );

  res.json({ systemPrompt });
});

export const aiWorkflowsControllers = {
  getServiceAIWorkflows,
  createAIWorkflow,
  updateAIWorkflow,
  deleteAIWorkflow,
  toggleAIWorkflow,
  generatePrompt,
};
