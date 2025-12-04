import { Op } from "sequelize";

import { HttpError } from "../helpers/HttpError.js";
import { getOffset } from "../helpers/getOffset.js";
import {
  sequelize,
  User,
  UserFollower,
  Service,
  WorkflowAITemplate,
  AITemplate,
} from "../db/sequelize.js";
import { filesServices } from "./filesServices.js";

const getCountFuncByColumn = (col) => {
  return sequelize.fn("COUNT", sequelize.fn("DISTINCT", sequelize.col(col)));
};

const getUserById = async (userId, currentUser) => {
  const isOwnProfile = userId === currentUser.id;

  const privateAttributes = isOwnProfile
    ? [
        [getCountFuncByColumn("favoriteServices.id"), "favoriteServicesCount"],
        [getCountFuncByColumn("aiWorkflows.id"), "aiWorkflowsCount"],
        [getCountFuncByColumn("following.id"), "followingCount"],
      ]
    : [];

  const privateInclude = isOwnProfile
    ? [
        {
          model: Service,
          as: "favoriteServices",
          through: { attributes: [] },
          attributes: [],
        },
        {
          model: WorkflowAITemplate,
          as: "aiWorkflows",
          attributes: [],
        },
        {
          model: User,
          as: "following",
          through: { attributes: [] },
          attributes: [],
        },
      ]
    : [];

  const [userInstance, follow] = await Promise.all([
    User.findByPk(userId, {
      include: [
        {
          model: Service,
          as: "services",
          attributes: [],
        },
        {
          model: User,
          as: "followers",
          through: { attributes: [] },
          attributes: [],
        },
        ...privateInclude,
      ],
      attributes: [
        "id",
        "name",
        "email",
        "avatarURL",
        "n8nEnabled",
        [getCountFuncByColumn("services.id"), "servicesCount"],
        [getCountFuncByColumn("followers.id"), "followersCount"],
        ...privateAttributes,
      ],
      group: [
        "User.id",
        "User.name",
        "User.email",
        "User.avatarURL",
        "User.n8nEnabled",
      ],
    }),
    isOwnProfile
      ? Promise.resolve(null)
      : UserFollower.findOne({ where: { userId, followerId: currentUser.id } }),
  ]);

  if (!userInstance) throw HttpError(404, "User not found");

  const userJson = userInstance.toJSON();

  return {
    ...userJson,
    servicesCount: Number(userJson.servicesCount),
    followersCount: Number(userJson.followersCount),
    favoriteServicesCount: userJson.favoriteServicesCount
      ? Number(userJson.favoriteServicesCount)
      : undefined,
    aiWorkflowsCount: userJson.aiWorkflowsCount
      ? Number(userJson.aiWorkflowsCount)
      : undefined,
    followingCount: userJson.followingCount
      ? Number(userJson.followingCount)
      : undefined,
    isFollowed: isOwnProfile ? undefined : !!follow,
  };
};

const updateUserAvatar = async (userId, file) => {
  if (!file) {
    throw HttpError(400, "No file uploaded");
  }

  const user = await User.findByPk(userId);

  if (!user) {
    throw HttpError(404, "User not found");
  }

  const avatarURL = await filesServices.processAvatar(file);

  if (user.avatarURL) {
    await filesServices.removeFile(user.avatarURL);
  }

  await user.update({ avatarURL: avatarURL });

  return user;
};

const getUserConnections = async ({ type, userId, query, currentUser }) => {
  const { page = 1, limit = 10 } = query;

  const isFollowers = type === "followers";
  const includeAlias = isFollowers ? "following" : "followers";
  const countWhere = isFollowers ? { userId } : { followerId: userId };

  const [users, total] = await Promise.all([
    User.findAll({
      attributes: ["id", "name", "avatarURL"],
      include: [
        {
          model: User,
          as: includeAlias,
          attributes: [],
          where: { id: userId },
        },
        ...(isFollowers
          ? [
              {
                model: User,
                as: "followers",
                attributes: ["id"],
                through: {
                  where: { followerId: currentUser.id },
                  attributes: [],
                },
                required: false,
              },
            ]
          : []),
      ],
      order: [["id", "DESC"]],
      offset: getOffset(page, limit),
      limit,
      group: [
        "User.id",
        `${includeAlias}->UserFollower.userId`,
        `${includeAlias}->UserFollower.followerId`,
        ...(isFollowers ? ["followers.id"] : []),
      ],
      subQuery: false,
    }),
    UserFollower.count({ where: countWhere }),
  ]);

  const key = isFollowers ? "followers" : "following";

  return {
    [key]: users.map((user) => {
      const { followers, ...userJSON } = user.toJSON();

      return {
        ...userJSON,
        isFollowed: isFollowers ? followers?.length > 0 : undefined,
      };
    }),
    total,
  };
};

const getFollowers = async (userId, query, currentUser) => {
  return await getUserConnections({
    type: "followers",
    userId,
    query,
    currentUser,
  });
};

const getFollowing = async (userId, query, currentUser) => {
  return await getUserConnections({
    type: "following",
    userId,
    query,
    currentUser,
  });
};

const followUser = async (userId, followId) => {
  if (userId === followId) {
    throw HttpError(400, "You can't follow yourself");
  }

  const [user, followUser] = await Promise.all([
    User.findByPk(userId),
    User.findByPk(followId),
  ]);

  if (!user || !followUser) {
    throw HttpError(404, "User not found");
  }

  await user.addFollowing(followUser);
};

const unFollowUser = async (userId, followId) => {
  if (userId === followId) {
    throw HttpError(400, "You can't unfollow yourself");
  }

  const [user, unFollowUser] = await Promise.all([
    User.findByPk(userId),
    User.findByPk(followId),
  ]);

  if (!user || !unFollowUser) {
    throw HttpError(404, "User not found");
  }

  await user.removeFollowing(unFollowUser);
};

const getUserAIWorkflows = async (userId) => {
  // Get all services owned by the user
  const services = await Service.findAll({
    where: { ownerId: userId },
    attributes: ["id"],
  });

  const serviceIds = services.map((s) => s.id);

  if (serviceIds.length === 0) {
    return [];
  }

  // Get all AI workflows for user's services
  const workflows = await WorkflowAITemplate.findAll({
    where: { serviceId: { [Op.in]: serviceIds } },
    include: [
      {
        model: AITemplate,
        as: "aiTemplate",
        attributes: ["id", "name", "description", "icon"],
      },
      {
        model: Service,
        as: "service",
        attributes: ["id", "title", "thumb"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return workflows.map((w) => w.toJSON());
};

export const usersServices = {
  getUserById,
  updateUserAvatar,
  getFollowers,
  getFollowing,
  followUser,
  unFollowUser,
  getUserAIWorkflows,
};
