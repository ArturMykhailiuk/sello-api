import { DataTypes, Model } from "sequelize";

export class Item extends Model {
  static initModel(sequelize) {
    Item.init(
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
        modelName: "Item",
        tableName: "items",
        timestamps: false,
      }
    );
  }

  static associate(sequelize) {
    const { Service, ServiceItem } = sequelize.models;

    Item.belongsToMany(Service, {
      through: ServiceItem,
      foreignKey: "itemId",
      as: "services",
      otherKey: "serviceId",
    });
  }
}
