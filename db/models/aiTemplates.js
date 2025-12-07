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
        formConfig: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: {
            fields: [
              {
                id: "name",
                type: "text",
                label: "Назва ассистента",
                placeholder: "наприклад, Асистент підтримки клієнтів",
                required: true,
                validation: {
                  minLength: 3,
                  maxLength: 100,
                  errorMessage: "Name must be between 3 and 100 characters",
                },
              },
              {
                id: "systemPrompt",
                type: "textarea",
                label: "Системний промпт",
                placeholder:
                  "Визначте роль і поведінку штучного інтелекту. Приклад: Ви — корисний асистент служби підтримки...",
                required: true,
                rows: 6,
                validation: {
                  minLength: 10,
                  maxLength: 2000,
                  errorMessage:
                    "System prompt must be between 10 and 2000 characters",
                },
                hint: "The system prompt defines how your AI assistant will behave and respond to users.",
              },
            ],
          },
          comment:
            "Dynamic form configuration for creating workflow from this template",
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
