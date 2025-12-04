import { sequelize } from "./sequelize.js";
import { WorkflowAITemplate } from "./models/workflowAITemplates.js";

async function addTestWorkflow() {
  try {
    await sequelize.authenticate();
    console.log("Database connected.");

    const workflow = await WorkflowAITemplate.create({
      userId: 5, // artur.myhajlyuk@gmail.com
      serviceId: null, // незалежний воркфлов
      aiTemplateId: null, // незалежний воркфлов
      name: "Test Independent Workflow",
      systemPrompt: "You are a helpful AI assistant.",
      n8nWorkflowId: "d1oyEGqf0WgcODvt", // існуючий воркфлов в n8n
      webhookUrl: "https://sell-o.shop/n8n/webhook-test/my-workflow",
      isActive: true,
    });

    console.log("Test workflow created:", workflow.toJSON());

    await sequelize.close();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

addTestWorkflow();
