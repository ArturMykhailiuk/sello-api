import { AITemplate } from "./sequelize.js";

const checkTemplates = async () => {
  try {
    const templates = await AITemplate.findAll();

    console.log(`\nFound ${templates.length} AI templates:`);
    templates.forEach((template) => {
      console.log(`\n=== ${template.name} (ID: ${template.id}) ===`);
      console.log("formConfig:", JSON.stringify(template.formConfig, null, 2));
    });

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
};

checkTemplates();
