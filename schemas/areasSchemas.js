import Joi from "joi";
import j2s from "joi-to-swagger";

import { paginationSchema } from "./commonSchemas.js";

export const getAllAreasQueryStringSchema = paginationSchema.keys({
  name: Joi.string().allow("").optional(),
});

export const { swagger: getAllAreasQueryStringSwagger } = j2s(
  getAllAreasQueryStringSchema
);

const getAllAreasResponseSchema = Joi.object({
  data: Joi.object({
    total: Joi.number().example(10),
    areas: Joi.array().items(
      Joi.object({
        id: Joi.number().example(1),
        name: Joi.string(),
        latitude: Joi.number().optional(),
        longitude: Joi.number().optional(),
        formattedAddress: Joi.string().optional(),
        city: Joi.string().optional(),
        country: Joi.string().optional(),
        street: Joi.string().optional(),
      })
    ),
  }),
});

export const { swagger: getAllAreasResponseSwagger } = j2s(
  getAllAreasResponseSchema
);

export const createOrUpdateAreaBodySchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
  formattedAddress: Joi.string().trim().max(500).optional(),
  city: Joi.string().trim().max(100).optional(),
  country: Joi.string().trim().max(100).optional(),
  street: Joi.string().trim().max(200).optional(),
});

export const { swagger: createOrUpdateAreaBodySwagger } = j2s(
  createOrUpdateAreaBodySchema
);
