import { formatSwaggerQuerySchema } from "./helpers/formatSwaggerQuerySchema.js";
import {
  getAllAreasQueryStringSwagger,
  getAllAreasResponseSwagger,
} from "./schemas/areasSchemas.js";
import {
  registerSwagger,
  registerResponseSwagger,
  loginSwagger,
  loginResponseSwagger,
  currentResponseSwagger,
} from "./schemas/authSchemas.js";
import {
  getAllCategoriesQueryStringSwagger,
  getAllCategoriesResponseSwagger,
} from "./schemas/categoriesSchemas.js";
import {
  paginationSwagger,
  errorResponseSwagger,
} from "./schemas/commonSchemas.js";
import {
  getAllIngredientsQueryStringSwagger,
  getAllIngredientsResponseSwagger,
} from "./schemas/ingredientsSchemas.js";
import {
  getAllItemsQueryStringSwagger,
  getAllItemsResponseSwagger,
  createItemSwagger,
  createItemResponseSwagger,
} from "./schemas/itemsSchemas.js";
import {
  getServicesQueryStringSwagger,
  getServicesResponseSwagger,
  createServiceBodySwagger,
  createServiceResponseSwagger,
  getServiceByIdResponseSwagger,
  getPopularServicesResponseSwagger,
  getFavoriteServicesResponseSwagger,
  addFavoriteServiceResponseSwagger,
} from "./schemas/servicesSchemas.js";

import { getAllTestimonialsResponseSwagger } from "./schemas/testimonialSchema.js";
import {
  followToUserResponseSwagger,
  gatFollowersResponseSwagger,
  gatFollowingResponseSwagger,
  getUserByIdResponseSwagger,
  updateAvatarResponseSwagger,
} from "./schemas/usersSchemas.js";
import { settings } from "./settings.js";

const errorResponseOptions = {
  content: {
    "application/json": {
      schema: errorResponseSwagger,
    },
  },
};

export const swaggerOptions = {
  openapi: "3.0.0",
  info: {
    title: "SELL-O API",
    version: "1.0.0",
  },
  servers: [{ url: settings.apiURL }],
  paths: {
    "/api/areas": {
      get: {
        tags: ["Areas"],
        parameters: formatSwaggerQuerySchema(getAllAreasQueryStringSwagger),
        responses: {
          200: {
            content: {
              "application/json": {
                schema: getAllAreasResponseSwagger,
              },
            },
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: registerSwagger,
            },
          },
        },
        responses: {
          201: {
            content: {
              "application/json": {
                schema: registerResponseSwagger,
              },
            },
          },
          400: errorResponseOptions,
          409: errorResponseOptions,
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: loginSwagger,
            },
          },
        },
        responses: {
          200: {
            content: {
              "application/json": {
                schema: loginResponseSwagger,
              },
            },
          },
          400: errorResponseOptions,
          401: errorResponseOptions,
        },
      },
    },
    "/api/auth/current": {
      get: {
        tags: ["Auth"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            content: {
              "application/json": {
                schema: currentResponseSwagger,
              },
            },
          },
          401: errorResponseOptions,
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        security: [{ BearerAuth: [] }],
        responses: {
          204: {
            content: {},
          },
          401: errorResponseOptions,
        },
      },
    },
    "/api/auth/google": {
      get: {
        tags: ["Auth"],
        summary: "Initiate Google OAuth authentication",
        description: "Redirects user to Google login page for authentication",
        responses: {
          302: {
            description: "Redirect to Google OAuth",
          },
        },
      },
    },
    "/api/auth/google/callback": {
      get: {
        tags: ["Auth"],
        summary: "Google OAuth callback",
        description:
          "Handles Google OAuth callback and redirects to frontend with JWT token",
        parameters: [
          {
            name: "code",
            in: "query",
            description: "Authorization code from Google",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          302: {
            description: "Redirect to frontend with token",
            headers: {
              Location: {
                description: "Frontend URL with token parameter",
                schema: {
                  type: "string",
                  example:
                    "http://localhost:5173/auth/google/callback?token=eyJhbGc...",
                },
              },
            },
          },
          401: errorResponseOptions,
        },
      },
    },
    "/api/categories": {
      get: {
        tags: ["Categories"],
        parameters: formatSwaggerQuerySchema(
          getAllCategoriesQueryStringSwagger
        ),
        responses: {
          200: {
            content: {
              "application/json": {
                schema: getAllCategoriesResponseSwagger,
              },
            },
          },
        },
      },
    },
    "/api/ingredients": {
      get: {
        tags: ["Ingredients"],
        parameters: formatSwaggerQuerySchema(
          getAllIngredientsQueryStringSwagger
        ),
        responses: {
          200: {
            content: {
              "application/json": {
                schema: getAllIngredientsResponseSwagger,
              },
            },
          },
        },
      },
    },
    "/api/items": {
      get: {
        tags: ["Items"],
        parameters: formatSwaggerQuerySchema(getAllItemsQueryStringSwagger),
        responses: {
          200: {
            content: {
              "application/json": {
                schema: getAllItemsResponseSwagger,
              },
            },
          },
        },
      },
      post: {
        tags: ["Items"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: createItemSwagger,
            },
          },
        },
        responses: {
          201: {
            content: {
              "application/json": {
                schema: createItemResponseSwagger,
              },
            },
          },
          400: errorResponseOptions,
          401: errorResponseOptions,
        },
      },
    },
    "/api/services": {
      get: {
        tags: ["Services"],
        security: [{ BearerAuth: [] }],
        parameters: formatSwaggerQuerySchema(getServicesQueryStringSwagger),
        responses: {
          200: {
            content: {
              "application/json": {
                schema: getServicesResponseSwagger,
              },
            },
          },
        },
      },
      post: {
        tags: ["Services"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                ...createServiceBodySwagger,
                properties: {
                  ...createServiceBodySwagger.properties,
                  thumb: {
                    type: "string",
                    format: "binary",
                    description: "The file to upload",
                  },
                },
                required: [...createServiceBodySwagger.required, "thumb"],
              },
            },
          },
        },
        responses: {
          201: {
            content: {
              "application/json": {
                schema: createServiceResponseSwagger,
              },
            },
          },
          400: errorResponseOptions,
          401: errorResponseOptions,
        },
      },
    },
    "/api/services/{serviceId}": {
      get: {
        tags: ["Services"],
        parameters: [
          {
            name: "serviceId",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "Service ID",
          },
        ],
        responses: {
          200: {
            content: {
              "application/json": {
                schema: getServiceByIdResponseSwagger,
              },
            },
          },
          400: errorResponseOptions,
          404: errorResponseOptions,
        },
      },
      delete: {
        tags: ["Services"],
        security: [{ BearerAuth: [] }],
        responses: {
          204: {
            content: {},
          },
          400: errorResponseOptions,
          401: errorResponseOptions,
          404: errorResponseOptions,
        },
      },
    },
    "/api/services/popular": {
      get: {
        tags: ["Services"],
        parameters: formatSwaggerQuerySchema(paginationSwagger),
        responses: {
          200: {
            content: {
              "application/json": {
                schema: getPopularServicesResponseSwagger,
              },
            },
          },
        },
      },
    },
    "/api/services/favorites": {
      get: {
        tags: ["Services"],
        security: [{ BearerAuth: [] }],
        parameters: formatSwaggerQuerySchema(paginationSwagger),
        responses: {
          200: {
            content: {
              "application/json": {
                schema: getFavoriteServicesResponseSwagger,
              },
            },
          },
          401: errorResponseOptions,
        },
      },
    },
    "/api/services/favorites/{serviceId}": {
      post: {
        tags: ["Services"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            content: {
              "application/json": {
                schema: addFavoriteServiceResponseSwagger,
              },
            },
          },
          400: errorResponseOptions,
          401: errorResponseOptions,
          404: errorResponseOptions,
        },
      },
      delete: {
        tags: ["Services"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            content: {
              "application/json": {
                schema: addFavoriteServiceResponseSwagger,
              },
            },
          },
          400: errorResponseOptions,
          401: errorResponseOptions,
          404: errorResponseOptions,
        },
      },
    },
    "/api/testimonials": {
      get: {
        tags: ["Testimonials"],
        parameters: formatSwaggerQuerySchema(paginationSwagger),
        responses: {
          200: {
            content: {
              "application/json": {
                schema: getAllTestimonialsResponseSwagger,
              },
            },
          },
        },
      },
    },
    "/api/users/avatars": {
      patch: {
        tags: ["Users"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  avatar: {
                    type: "string",
                    format: "binary",
                    description: "The file to upload",
                  },
                },
                required: ["avatar"],
              },
            },
          },
        },
        responses: {
          200: {
            content: {
              "application/json": {
                schema: updateAvatarResponseSwagger,
              },
            },
          },
          400: errorResponseOptions,
          401: errorResponseOptions,
          404: errorResponseOptions,
        },
      },
    },
    "/api/users/{userId}": {
      get: {
        tags: ["Users"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            content: {
              "application/json": {
                schema: getUserByIdResponseSwagger,
              },
            },
          },
          400: errorResponseOptions,
          401: errorResponseOptions,
          404: errorResponseOptions,
        },
      },
    },
    "/api/users/{userId}/followers": {
      get: {
        tags: ["Users"],
        security: [{ BearerAuth: [] }],
        parameters: formatSwaggerQuerySchema(paginationSwagger),
        responses: {
          200: {
            content: {
              "application/json": {
                schema: gatFollowersResponseSwagger,
              },
            },
          },
          400: errorResponseOptions,
          401: errorResponseOptions,
        },
      },
    },
    "/api/users/following": {
      get: {
        tags: ["Users"],
        security: [{ BearerAuth: [] }],
        parameters: formatSwaggerQuerySchema(paginationSwagger),
        responses: {
          200: {
            content: {
              "application/json": {
                schema: gatFollowingResponseSwagger,
              },
            },
          },
          400: errorResponseOptions,
          401: errorResponseOptions,
        },
      },
    },
    "/api/users/following/{userId}": {
      post: {
        tags: ["Users"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            content: {
              "application/json": {
                schema: followToUserResponseSwagger,
              },
            },
          },
          400: errorResponseOptions,
          401: errorResponseOptions,
          404: errorResponseOptions,
        },
      },
      delete: {
        tags: ["Users"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            content: {
              "application/json": {
                schema: followToUserResponseSwagger,
              },
            },
          },
          400: errorResponseOptions,
          401: errorResponseOptions,
          404: errorResponseOptions,
        },
      },
    },
  },
};
