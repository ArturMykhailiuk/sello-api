import { sequelize } from "./sequelize.js";
import { User } from "./models/users.js";

async function checkUsers() {
  try {
    await sequelize.authenticate();
    console.log("Database connected.");

    const users = await User.findAll({
      attributes: ["id", "name", "email"],
      limit: 10,
    });

    console.log("Users in database:");
    users.forEach((user) => {
      console.log(`ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
    });

    await sequelize.close();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkUsers();
