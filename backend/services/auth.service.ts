import { verifyMessageSignatureRsv, verifyMessageSignature } from "@stacks/encryption";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  generateUserToken,
  type UserTokenPayload,
} from "../middleware/auth";

export const authService = {
  async verifyWalletAndLogin(data: {
    stxAddress: string;
    publicKey: string;
    signature: string;
    message: string;
    role: "client" | "freelancer";
  }) {
    const { stxAddress, publicKey, signature, message, role } = data;

    // Fix: @stacks/connect v8 uses 'stx_signMessage' which returns signatures in
    // different formats depending on the wallet (Leather, Xverse, etc.).
    // We try both verifyMessageSignatureRsv (Clarity-compatible, RSV format) and
    // the legacy verifyMessageSignature to handle all wallet implementations.
    let isValid = false;
    try {
      isValid = verifyMessageSignatureRsv({ message, publicKey, signature });
    } catch {
      // RSV parse failed — try legacy format
    }
    if (!isValid) {
      try {
        isValid = verifyMessageSignature({ message, publicKey, signature });
      } catch {
        // Both failed
      }
    }

    if (!isValid) {
      throw new Error("Invalid wallet signature");
    }

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.stxAddress, stxAddress));

    let user;

    if (existingUser) {
      // Existing user — role is permanent, always use stored role
      user = existingUser;
    } else {
      // New user — create with chosen role
      const result = await db
        .insert(users)
        .values({
          stxAddress,
          role,
        });
      const [newUser] = await db.select().from(users).where(eq(users.id, result[0].insertId));
      user = newUser;
    }

    // Generate JWT
    const tokenPayload: UserTokenPayload = {
      id: user.id,
      stxAddress: user.stxAddress,
      role: user.role,
    };

    const token = generateUserToken(tokenPayload);

    return { user, token };
  },

  async getUserById(id: number) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  },

  async getUserByAddress(stxAddress: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.stxAddress, stxAddress));
    return user || null;
  },
};
