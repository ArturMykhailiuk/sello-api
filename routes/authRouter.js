import express from "express";
import passport from "../helpers/passport.js";

import { authControllers } from "../controllers/authControllers.js";
import { authenticate } from "../middlewares/authenticate.js";
import { validateBody } from "../middlewares/validateBody.js";
import { registerSchema, loginSchema } from "../schemas/authSchemas.js";

export const authRouter = express.Router();

authRouter.post(
  "/register",
  validateBody(registerSchema),
  authControllers.register
);

authRouter.post("/login", validateBody(loginSchema), authControllers.login);

authRouter.get("/current", authenticate, authControllers.currentUser);

authRouter.post("/logout", authenticate, authControllers.logout);

// Google OAuth routes
authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  authControllers.googleCallback
);
