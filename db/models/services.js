import { DataTypes, Model } from "sequelize";

export class Service extends Model {
  static initModel(sequelize) {
    Service.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        title: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        categoryId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        ownerId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        instructions: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        thumb: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        time: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: "Service",
        tableName: "services",
        timestamps: true,
      }
    );
  }

  static associate(sequelize) {
    const {
      Category,
      User,
      Area,
      Item,
      ServiceItem,
      ServiceArea,
      UserFavoriteService,
      WorkflowAITemplate,
    } = sequelize.models;

    Service.belongsTo(Category, {
      foreignKey: "categoryId",
      as: "category",
    });

    Service.belongsTo(User, {
      foreignKey: "ownerId",
      as: "owner",
    });

    Service.belongsToMany(Area, {
      through: ServiceArea,
      foreignKey: "serviceId",
      as: "areas",
      otherKey: "areaId",
    });

    Service.hasMany(ServiceArea, {
      foreignKey: "serviceId",
      as: "serviceAreas",
    });

    Service.belongsToMany(Item, {
      through: ServiceItem,
      foreignKey: "serviceId",
      as: "items",
      otherKey: "itemId",
    });

    Service.hasMany(ServiceItem, {
      foreignKey: "serviceId",
      as: "serviceItems",
    });

    Service.belongsToMany(User, {
      through: UserFavoriteService,
      as: "fans",
      foreignKey: "serviceId",
      otherKey: "userId",
    });

    Service.hasMany(UserFavoriteService, {
      foreignKey: "serviceId",
      as: "userFavoriteServices",
    });

    Service.hasMany(WorkflowAITemplate, {
      foreignKey: "serviceId",
      as: "aiWorkflows",
    });
  }
}
