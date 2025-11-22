import { DataTypes, Model } from "sequelize";

export class ServiceItem extends Model {
  static initModel(sequelize) {
    ServiceItem.init(
      {
        itemId: {
          type: DataTypes.INTEGER,
          references: {
            model: "Item",
            key: "id",
          },
          allowNull: false,
        },
        serviceId: {
          type: DataTypes.INTEGER,
          references: {
            model: "Service",
            key: "id",
          },
          allowNull: false,
        },
        measure: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: "ServiceItem",
        tableName: "serviceItems",
        timestamps: false,
      }
    );
  }
}
