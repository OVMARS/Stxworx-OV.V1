import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { requireAuth } from "../middleware/auth";

export const userRoutes = Router();

// Static routes MUST come before dynamic /:address routes to avoid shadowing
userRoutes.get("/leaderboard", userController.getLeaderboard);

// Protected — static path must be registered before /:address wildcard
userRoutes.patch("/me", requireAuth, userController.updateMe);

// Public — dynamic param routes come last
userRoutes.get("/:address", userController.getByAddress);
userRoutes.get("/:address/reviews", userController.getReviews);
userRoutes.get("/:address/projects", userController.getProjectsByAddress);
