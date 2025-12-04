import { DataTypes, Model } from "sequelize";

export class WorkflowAITemplate extends Model {
  static initModel(sequelize) {
    WorkflowAITemplate.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        serviceId: {
          type: DataTypes.INTEGER,
          allowNull: true, // Service is optional
          references: {
            model: "services",
            key: "id",
          },
          onDelete: "CASCADE",
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false, // User is always required
          references: {
            model: "users",
            key: "id",
          },
          onDelete: "CASCADE",
        },
        aiTemplateId: {
          type: DataTypes.INTEGER,
          allowNull: true, // Template is optional
          references: {
            model: "ai_templates",
            key: "id",
          },
          onDelete: "SET NULL",
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notEmpty: true,
          },
        },
        systemPrompt: {
          type: DataTypes.TEXT,
          allowNull: false,
          validate: {
            notEmpty: true,
          },
        },
        n8nWorkflowId: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: "n8n workflow ID",
        },
        webhookUrl: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: "n8n webhook URL for this AI assistant",
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
      },
      {
        sequelize,
        modelName: "WorkflowAITemplate",
        tableName: "workflow_ai_templates",
        timestamps: true,
      }
    );
  }

  static associate(sequelize) {
    const { Service, AITemplate, User } = sequelize.models;

    WorkflowAITemplate.belongsTo(Service, {
      foreignKey: "serviceId",
      as: "service",
    });

    WorkflowAITemplate.belongsTo(User, {
      foreignKey: "userId",
      as: "user",
    });

    WorkflowAITemplate.belongsTo(AITemplate, {
      foreignKey: "aiTemplateId",
      as: "aiTemplate",
    });
  }

  // Instance methods
  async activate() {
    this.isActive = true;
    await this.save();
    return this;
  }

  async deactivate() {
    this.isActive = false;
    await this.save();
    return this;
  }
}
