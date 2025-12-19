import { DataTypes, Model } from "sequelize";

export class ServiceArea extends Model {
  static initModel(sequelize) {
    ServiceArea.init(
      {
        serviceId: {
          type: DataTypes.INTEGER,
          references: {
            model: "Service",
            key: "id",
          },
          allowNull: false,
        },
        areaId: {
          type: DataTypes.INTEGER,
          references: {
            model: "Area",
            key: "id",
          },
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: "ServiceArea",
        tableName: "serviceAreas",
        timestamps: false,
      }
    );
  }
}
