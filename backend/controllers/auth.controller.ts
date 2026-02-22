import { type Request, type Response } from "express";
import { z } from "zod";
import { authService } from "../services/auth.service";
import { getUserCookieName } from "../middleware/auth";

const verifyWalletSchema = z.object({
  stxAddress: z.string().min(1),
  publicKey: z.string().min(1),
  signature: z.string().min(1),
  message: z.string().min(1),
  role: z.enum(["client", "freelancer"]),
});

export const authController = {
  // POST /api/auth/verify-wallet
  async verifyWallet(req: Request, res: Response) {
    try {
      const result = verifyWalletSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Validation error", errors: result.error.errors });
      }

      const { user, token } = await authService.verifyWalletAndLogin(result.data);

      const isProduction = process.env.NODE_ENV === "production";
      // Fix: use sameSite 'lax' instead of 'strict'.
      // 'strict' blocks cookies on cross-origin navigations (e.g. from the
      // manus.computer preview proxy), which breaks the entire auth flow.
      // 'lax' still protects against CSRF while allowing top-level navigations.
      res.cookie(getUserCookieName(), token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
        path: "/",
      });

      return res.status(200).json({
        message: "Login successful",
        user: {
          id: user.id,
          stxAddress: user.stxAddress,
          username: user.username,
          role: user.role,
        },
      });
    } catch (error: any) {
      // Fix: catch all signature-related errors and return 401 (not 500)
      if (
        error.message === "Invalid wallet signature" ||
        error.message?.includes("Invalid signature") ||
        error.message?.includes("signature") ||
        error.message?.includes("parseRecoverableSignature")
      ) {
        return res.status(401).json({ message: "Invalid wallet signature. Please try connecting again." });
      }
      console.error("Wallet verify error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // POST /api/auth/logout
  async logout(_req: Request, res: Response) {
    res.clearCookie(getUserCookieName(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return res.status(200).json({ message: "Logout successful" });
  },

  // GET /api/auth/me
  async me(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await authService.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        user: {
          id: user.id,
          stxAddress: user.stxAddress,
          username: user.username,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error("Get me error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
};
