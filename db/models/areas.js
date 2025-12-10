import { DataTypes, Model } from "sequelize";

export class Area extends Model {
  static initModel(sequelize) {
    Area.init(
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
        latitude: {
          type: DataTypes.DECIMAL(10, 8),
          allowNull: true,
        },
        longitude: {
          type: DataTypes.DECIMAL(11, 8),
          allowNull: true,
        },
        formattedAddress: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        city: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        country: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        street: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "Area",
        tableName: "areas",
        timestamps: false,
      }
    );
  }

  static associate(sequelize) {
    const { Service, ServiceArea } = sequelize.models;

    Area.belongsToMany(Service, {
      through: ServiceArea,
      foreignKey: "areaId",
      as: "services",
      otherKey: "serviceId",
    });

    Area.hasMany(ServiceArea, {
      foreignKey: "areaId",
      as: "serviceAreas",
    });
  }
}
