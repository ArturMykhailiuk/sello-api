import { DataTypes, Model } from "sequelize";

export class UserFavoriteService extends Model {
  static initModel(sequelize) {
    UserFavoriteService.init(
      {
        userId: {
          type: DataTypes.INTEGER,
          references: {
            model: "User",
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
      },
      {
        sequelize,
        modelName: "UserFavoriteService",
        tableName: "userFavoriteServices",
        timestamps: false,
      }
    );
  }
}
