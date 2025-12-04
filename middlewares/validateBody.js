import { HttpError } from "../helpers/HttpError.js";

export const validateBody = (schema) => {
  const func = (req, _, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      console.log("Validation error:", error.message);
      console.log("Request body:", req.body);
      return next(HttpError(400, error.message));
    }
    return next();
  };

  return func;
};
