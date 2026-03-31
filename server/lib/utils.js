import jwt from "jsonwebtoken";

// Function to generate a token for a user
export const generateToken = (userId) => {
  const jwtSecret = process.env.JWT_SECRET?.trim();

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is missing in environment configuration");
  }

  const token = jwt.sign({ userId }, jwtSecret, { expiresIn: "7d" });
  return token;
};
