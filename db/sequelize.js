import { Sequelize } from "sequelize";

import { Area } from "./models/areas.js";
import { Category } from "./models/categories.js";
import { Testimonial } from "./models/testimonials.js";
import { User } from "./models/users.js";
import { UserFavoriteService } from "./models/userFavoriteService.js";
import { UserFollower } from "./models/userFollowers.js";
import { settings } from "../settings.js";

import { Service } from "./models/services.js";
import { Item } from "./models/items.js";
import { ServiceItem } from "./models/serviceItem.js";
import { ServiceArea } from "./models/ServiceArea.js";
import { AITemplate } from "./models/aiTemplates.js";
import { WorkflowAITemplate } from "./models/workflowAITemplates.js";

const sequelize = new Sequelize({
  dialect: "postgres",
  username: settings.dbUsername,
  password: settings.dbPassword,
  host: settings.dbHost,
  database: settings.dbName,
  port: settings.dbPort,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

export const verifySequelizeConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection successful.");
  } catch (error) {
    console.error("Unable to connect to the database.");
    throw error;
  }
};

ServiceItem.initModel(sequelize);
ServiceArea.initModel(sequelize);
UserFavoriteService.initModel(sequelize);
UserFollower.initModel(sequelize);

Area.initModel(sequelize);
Category.initModel(sequelize);
Service.initModel(sequelize);
Item.initModel(sequelize);
Testimonial.initModel(sequelize);
User.initModel(sequelize);
AITemplate.initModel(sequelize);
WorkflowAITemplate.initModel(sequelize);

Item.associate(sequelize);
Area.associate(sequelize);
Service.associate(sequelize);
Testimonial.associate(sequelize);
User.associate(sequelize);
AITemplate.associate(sequelize);
WorkflowAITemplate.associate(sequelize);

export {
  sequelize,
  Area,
  Category,
  Item,
  Service,
  Testimonial,
  User,
  ServiceItem,
  ServiceArea,
  UserFavoriteService,
  UserFollower,
  AITemplate,
  WorkflowAITemplate,
};
