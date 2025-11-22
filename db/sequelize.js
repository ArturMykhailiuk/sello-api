import { Sequelize } from "sequelize";

import { Area } from "./models/areas.js";
import { Category } from "./models/categories.js";
import { Ingredient } from "./models/ingredients.js";
import { RecipeIngredient } from "./models/recipeIngredient.js";
import { Recipe } from "./models/recipes.js";
import { Testimonial } from "./models/testimonials.js";
import { User } from "./models/users.js";
import { UserFavoriteRecipe } from "./models/userFavoriteRecipes.js";
import { UserFavoriteService } from "./models/userFavoriteService.js";
import { UserFollower } from "./models/userFollowers.js";
import { settings } from "../settings.js";

import { Service } from "./models/services.js";
import { Item } from "./models/items.js";
import { ServiceItem } from "./models/serviceItem.js";

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

RecipeIngredient.initModel(sequelize);
ServiceItem.initModel(sequelize);
UserFavoriteRecipe.initModel(sequelize);
UserFavoriteService.initModel(sequelize);
UserFollower.initModel(sequelize);

Area.initModel(sequelize);
Category.initModel(sequelize);
Ingredient.initModel(sequelize);
Recipe.initModel(sequelize);
Service.initModel(sequelize);
Item.initModel(sequelize);
Testimonial.initModel(sequelize);
User.initModel(sequelize);

Ingredient.associate(sequelize);
Item.associate(sequelize);
Recipe.associate(sequelize);
Service.associate(sequelize);
Testimonial.associate(sequelize);
User.associate(sequelize);

export {
  sequelize,
  Area,
  Category,
  Ingredient,
  Item,
  Recipe,
  Service,
  Testimonial,
  User,
  RecipeIngredient,
  ServiceItem,
  UserFavoriteRecipe,
  UserFavoriteService,
  UserFollower,
};
