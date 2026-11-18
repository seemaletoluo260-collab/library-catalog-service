import { model, Schema } from "mongoose";
import { Buffer } from "node:buffer";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { z } from "zod/v4";

export type UserRole = "patron" | "librarian";

type UserRecord = {
  username: string;
  email: string;
  password: string;
  role: UserRole;
};

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, 64, (error, key) => {
      if (error)
        reject(error);
      else
        resolve(key);
    });
  });
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt);
  return `scrypt:${salt.toString("hex")}:${key.toString("hex")}`;
}

const userSchema = new Schema<UserRecord>({
  username: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false,
  },
  role: {
    type: String,
    enum: ["patron", "librarian"],
    default: "patron",
    required: true,
  },
}, { timestamps: true });

userSchema.pre("save", async function () {
  if (this.isModified("password"))
    this.password = await hashPassword(this.password);
});

userSchema.set("toJSON", {
  transform(_document, returned) {
    const { password: _password, ...safeUser } = returned;
    return safeUser;
  },
});

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, saltHex, keyHex] = storedHash.split(":");
  if (algorithm !== "scrypt" || !saltHex || !keyHex || !/^[\da-f]+$/i.test(saltHex) || !/^[\da-f]+$/i.test(keyHex))
    return false;

  const expectedKey = Buffer.from(keyHex, "hex");
  if (expectedKey.length !== 64)
    return false;
  const actualKey = await deriveKey(password, Buffer.from(saltHex, "hex"));
  return timingSafeEqual(actualKey, expectedKey);
}

export const userInputSchema = z.object({
  username: z.string().trim().min(2).max(50),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(128),
});

const User = model<UserRecord>("User", userSchema);
export default User;
