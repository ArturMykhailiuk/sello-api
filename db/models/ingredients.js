import { DataTypes, Model } from "sequelize";

export class Ingredient extends Model {
  static initModel(sequelize) {
    Ingredient.init(
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
        desc: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        imgURL: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: "Ingredient",
        tableName: "ingredients",
        timestamps: false,
      }
    );
  }

  static associate(sequelize) {
    // No associations for Ingredient model
  }
}
