import mongoose from "mongoose";

// Function to connect to the mongodb database
export const connectDB = async () => {
  const rawUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const mongoUri = rawUri?.trim();

  if (!mongoUri) {
    throw new Error(
      "MongoDB URI is missing. Set MONGODB_URI (or MONGO_URI) in .env"
    );
  }

  if (
    !mongoUri.startsWith("mongodb://") &&
    !mongoUri.startsWith("mongodb+srv://")
  ) {
    throw new Error(
      'Invalid MongoDB URI. It must start with "mongodb://" or "mongodb+srv://"'
    );
  }

  try {
    mongoose.connection.on("connected", () =>
      console.log("Database Connected")
    );

    await mongoose.connect(mongoUri, {
      dbName: "chat-app",
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};
