import Joi from "joi";
import j2s from "joi-to-swagger";

import { paginationSchema } from "./commonSchemas.js";

export const getAllItemsQueryStringSchema = paginationSchema.keys({
  name: Joi.string().allow("").optional(),
});

export const { swagger: getAllItemsQueryStringSwagger } = j2s(
  getAllItemsQueryStringSchema
);

const getAllItemsResponseSchema = Joi.object({
  data: Joi.object({
    total: Joi.number().example(10),
    items: Joi.array().items(
      Joi.object({
        id: Joi.number().example(1),
        name: Joi.string(),
        imgURL: Joi.string(),
      })
    ),
  }),
});

export const { swagger: getAllItemsResponseSwagger } = j2s(
  getAllItemsResponseSchema
);
