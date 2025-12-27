import { DataTypes, Model } from "sequelize";
import { encrypt, decrypt } from "../../helpers/encryption.js";

export class User extends Model {
  static initModel(sequelize) {
    User.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        password: {
          type: DataTypes.STRING,
          allowNull: true, // Allow null for OAuth users
        },
        googleId: {
          type: DataTypes.STRING,
          allowNull: true,
          unique: true,
        },
        avatarURL: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        token: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        n8nApiKey: {
          type: DataTypes.TEXT,
          allowNull: true,
          get() {
            const encryptedKey = this.getDataValue("n8nApiKey");
            // Check for null, undefined, or empty string
            if (!encryptedKey || encryptedKey.trim() === "") {
              return null;
            }
            try {
              return decrypt(encryptedKey);
            } catch (error) {
              console.error("Error decrypting n8nApiKey:", error.message);
              // If decryption fails, return null to avoid breaking the app
              return null;
            }
          },
          set(value) {
            if (value) {
              this.setDataValue("n8nApiKey", encrypt(value));
            } else {
              this.setDataValue("n8nApiKey", null);
            }
          },
        },
        n8nUserId: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        n8nEnabled: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        sequelize,
        modelName: "User",
        tableName: "users",
        timestamps: true,
      }
    );
  }

  static associate(sequelize) {
    const { Service, UserFollower, UserFavoriteService, WorkflowAITemplate } =
      sequelize.models;

    User.belongsToMany(User, {
      through: UserFollower,
      as: "following",
      foreignKey: "followerId",
      otherKey: "userId",
    });

    User.belongsToMany(User, {
      through: UserFollower,
      as: "followers",
      foreignKey: "userId",
      otherKey: "followerId",
    });

    User.belongsToMany(Service, {
      through: UserFavoriteService,
      as: "favoriteServices",
      foreignKey: "userId",
      otherKey: "serviceId",
    });

    User.hasMany(Service, {
      as: "services",
      foreignKey: "ownerId",
    });

    User.hasMany(WorkflowAITemplate, {
      as: "aiWorkflows",
      foreignKey: "userId",
    });
  }
}
