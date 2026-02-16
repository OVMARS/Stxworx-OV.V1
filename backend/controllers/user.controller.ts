import { type Request, type Response } from "express";
import { z } from "zod";
import { db } from "../db";
import { users, reviews, projects } from "@shared/schema";
import { eq, sql, and, count, avg } from "drizzle-orm";

const updateProfileSchema = z.object({
  username: z.string().min(1).max(100).optional(),
});

export const userController = {
  // GET /api/users/:address
  async getByAddress(req: Request, res: Response) {
    try {
      const { address } = req.params;
      const [user] = await db
        .select({
          id: users.id,
          stxAddress: users.stxAddress,
          username: users.username,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.stxAddress, address));

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json(user);
    } catch (error) {
      console.error("Get user error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // PATCH /api/users/me
  async updateMe(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const result = updateProfileSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Validation error", errors: result.error.errors });
      }

      await db
        .update(users)
        .set({ ...result.data, updatedAt: new Date() })
        .where(eq(users.id, req.user.id));
      const [updated] = await db.select().from(users).where(eq(users.id, req.user.id));

      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        id: updated.id,
        stxAddress: updated.stxAddress,
        username: updated.username,
        role: updated.role,
        isActive: updated.isActive,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // GET /api/users/:address/reviews
  async getReviews(req: Request, res: Response) {
    try {
      const { address } = req.params;
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.stxAddress, address));

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userReviews = await db
        .select()
        .from(reviews)
        .where(eq(reviews.revieweeId, user.id));

      return res.status(200).json(userReviews);
    } catch (error) {
      console.error("Get reviews error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // GET /api/users/leaderboard
  async getLeaderboard(_req: Request, res: Response) {
    try {
      // Get all freelancers with their completed project count and avg rating
      const freelancers = await db
        .select({
          id: users.id,
          stxAddress: users.stxAddress,
          username: users.username,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(and(eq(users.role, "freelancer"), eq(users.isActive, true)));

      // For each freelancer, compute completed projects count and avg rating
      const leaderboard = await Promise.all(
        freelancers.map(async (f) => {
          // Count completed projects where this freelancer was assigned
          const [completedResult] = await db
            .select({ count: count() })
            .from(projects)
            .where(
              and(
                eq(projects.freelancerId, f.id),
                eq(projects.status, "completed")
              )
            );

          // Get average rating from reviews where this freelancer is the reviewee
          const [ratingResult] = await db
            .select({ avgRating: avg(reviews.rating) })
            .from(reviews)
            .where(eq(reviews.revieweeId, f.id));

          // Count total reviews
          const [reviewCountResult] = await db
            .select({ count: count() })
            .from(reviews)
            .where(eq(reviews.revieweeId, f.id));

          return {
            id: f.id,
            stxAddress: f.stxAddress,
            username: f.username,
            jobsCompleted: completedResult?.count ?? 0,
            avgRating: ratingResult?.avgRating ? parseFloat(String(ratingResult.avgRating)) : 0,
            reviewCount: reviewCountResult?.count ?? 0,
            createdAt: f.createdAt,
          };
        })
      );

      // Sort: primary by jobsCompleted desc, secondary by avgRating desc
      leaderboard.sort((a, b) => {
        if (b.jobsCompleted !== a.jobsCompleted) return b.jobsCompleted - a.jobsCompleted;
        return b.avgRating - a.avgRating;
      });

      // Add rank
      const ranked = leaderboard.map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

      return res.status(200).json(ranked);
    } catch (error) {
      console.error("Leaderboard error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
};
