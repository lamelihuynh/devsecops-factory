import jwt from "jsonwebtoken";
import { ENV } from "./env.js";

export const generateToken = (userId, res) => {
  const { JWT_SECRET } = ENV;
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "1d",
  });

  res.cookie("jwt", token, {
    maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day to milliseconds
    httpOnly: true,
    sameSite: "strict", // to prevent CSRF attacks
    secure: ENV.NODE_ENV === "production" ? true : false, // set secure flag in production
  });

  return token;
};
