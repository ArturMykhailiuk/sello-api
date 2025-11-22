import Joi from "joi";
import j2s from "joi-to-swagger";

import { paginationSchema } from "./commonSchemas.js";

export const updateFavoriteByIdSchema = Joi.object({
  serviceId: Joi.number().integer().required(),
});

export const getServiceByIdParamsSchema = Joi.object({
  serviceId: Joi.number().integer().required(),
});

const getServiceByIdResponseSchema = Joi.object({
  data: Joi.object({
    service: Joi.object({
      id: Joi.number().example(1),
      title: Joi.string(),
      instructions: Joi.string(),
      description: Joi.string(),
      thumb: Joi.string(),
      time: Joi.number().example(60),
      createdAt: Joi.date(),
      updatedAt: Joi.date(),
      isFavorite: Joi.boolean().optional(),
      owner: Joi.object({
        id: Joi.number().example(1),
        name: Joi.string(),
        avatarURL: Joi.string(),
      }),
      area: Joi.object({
        id: Joi.number().example(1),
        name: Joi.string(),
      }),
      category: Joi.object({
        id: Joi.number().example(1),
        name: Joi.string(),
      }),
      items: Joi.array().items(
        Joi.object({
          id: Joi.number().example(1),
          name: Joi.string(),
          measure: Joi.string(),
          imgURL: Joi.string(),
        })
      ),
    }),
  }),
});

export const { swagger: getServiceByIdResponseSwagger } = j2s(
  getServiceByIdResponseSchema
);

export const getServicesQueryStringSchema = paginationSchema.keys({
  categoryId: Joi.number().integer().optional(),
  areaId: Joi.number().integer().optional(),
  itemId: Joi.number().integer().optional(),
  ownerId: Joi.number().integer().optional(),
});

export const { swagger: getServicesQueryStringSwagger } = j2s(
  getServicesQueryStringSchema
);

const itemSchema = Joi.object({
  id: Joi.number().integer().required(),
  measure: Joi.string().trim().max(200).required(),
});

export const createServiceBodySchema = Joi.object({
  title: Joi.string().trim().max(100).required(),
  categoryId: Joi.number().integer().required(),
  areaId: Joi.number().integer().required(),
  description: Joi.string().trim().max(200).required(),
  instructions: Joi.string().trim().max(200).required(),
  time: Joi.number().integer().required(),
  items: Joi.array().items(itemSchema).min(1).required(),
});

export const { swagger: createServiceBodySwagger } = j2s(
  createServiceBodySchema
);

const createServiceResponseSchema = Joi.object({
  data: Joi.object({
    service: Joi.object({
      id: Joi.number().example(1),
      title: Joi.string(),
      categoryId: Joi.number().example(1),
      areaId: Joi.number().example(1),
      description: Joi.string(),
      instructions: Joi.string(),
      time: Joi.number().example(60),
      thumb: Joi.string(),
      ownerId: Joi.number().example(1),
      createdAt: Joi.date(),
      updatedAt: Joi.date(),
      serviceItems: Joi.array().items(
        Joi.object({
          serviceId: Joi.number().example(1),
          itemId: Joi.number().example(1),
          measure: Joi.string(),
        })
      ),
    }),
  }),
});

export const { swagger: createServiceResponseSwagger } = j2s(
  createServiceResponseSchema
);

export const deleteServiceParamsSchema = Joi.object({
  serviceId: Joi.number().integer().required(),
});

const serviceSchema = Joi.object({
  id: Joi.number().example(1),
  title: Joi.string(),
  description: Joi.string(),
  thumb: Joi.string(),
  createdAt: Joi.date(),
  updatedAt: Joi.date(),
  owner: Joi.object({
    id: Joi.number().example(1),
    name: Joi.string(),
    avatarURL: Joi.string(),
  }),
});

const getServicesResponseSchema = Joi.object({
  data: Joi.object({
    total: Joi.number().example(10),
    services: Joi.array().items(
      serviceSchema.keys({
        isFavorite: Joi.boolean().optional(),
      })
    ),
  }),
});

export const { swagger: getServicesResponseSwagger } = j2s(
  getServicesResponseSchema
);

const getPopularServicesResponseSchema = Joi.object({
  data: Joi.object({
    total: Joi.number().example(10),
    popularServices: Joi.array().items(serviceSchema),
  }),
});

export const { swagger: getPopularServicesResponseSwagger } = j2s(
  getPopularServicesResponseSchema
);

const getFavoriteServicesResponseSchema = Joi.object({
  data: Joi.object({
    total: Joi.number().example(10),
    favoriteServices: Joi.array().items(serviceSchema),
  }),
});

export const { swagger: getFavoriteServicesResponseSwagger } = j2s(
  getFavoriteServicesResponseSchema
);

const addFavoriteServiceResponseSchema = Joi.object({
  data: Joi.object({
    message: Joi.string(),
  }),
});

export const { swagger: addFavoriteServiceResponseSwagger } = j2s(
  addFavoriteServiceResponseSchema
);
