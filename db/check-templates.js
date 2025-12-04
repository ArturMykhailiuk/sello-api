import { AITemplate } from "./sequelize.js";

const checkTemplates = async () => {
  try {
    const templates = await AITemplate.findAll({
      attributes: ["id", "name"],
    });
    
    console.log(`\nFound ${templates.length} AI templates:`);
    templates.forEach(template => {
      console.log(` - ID ${template.id}: ${template.name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
};

checkTemplates();
