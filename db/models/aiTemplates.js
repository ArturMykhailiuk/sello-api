import { DataTypes, Model } from "sequelize";

export class AITemplate extends Model {
  static initModel(sequelize) {
    AITemplate.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
            notEmpty: true,
          },
        },
        aiTemplate: {
          type: DataTypes.JSON,
          allowNull: false,
          comment: "n8n workflow JSON template structure",
        },
      },
      {
        sequelize,
        modelName: "AITemplate",
        tableName: "ai_templates",
        timestamps: true,
      }
    );
  }

  static associate(sequelize) {
    const { WorkflowAITemplate } = sequelize.models;

    AITemplate.hasMany(WorkflowAITemplate, {
      foreignKey: "aiTemplateId",
      as: "workflows",
    });
  }
}
