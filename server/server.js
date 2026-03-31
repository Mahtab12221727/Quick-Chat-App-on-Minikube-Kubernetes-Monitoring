import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { collectDefaultMetrics, Registry, Counter, Gauge } from "prom-client";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const requireEnv = (key) => {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};


requireEnv("JWT_SECRET");

const register = new Registry();
collectDefaultMetrics({ register });
const requestCounter = new Counter({
  name: "quick_chat_http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "path", "status_code"],
  registers: [register],
});
const activeWebsocketUsers = new Gauge({
  name: "quick_chat_active_ws_users",
  help: "Currently connected websocket users",
  registers: [register],
});

const app = express();
const server = http.createServer(app);


export const io = new Server(server, {
  cors: { origin: "*" },
});


export const userSocketMap = {};


io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User Connected", userId);

  if (userId) userSocketMap[userId] = socket.id;
  activeWebsocketUsers.set(Object.keys(userSocketMap).length);

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User Disconnected", userId);
    delete userSocketMap[userId];
    activeWebsocketUsers.set(Object.keys(userSocketMap).length);
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});


app.use(express.json({ limit: "4mb" }));
app.use(cors());

app.use((req, res, next) => {
  res.on("finish", () => {
    requestCounter.inc({
      method: req.method,
      path: req.path,
      status_code: res.statusCode,
    });
  });
  next();
});

app.get("/", (req, res) => {
  res.send("Welcome to Quick Chat API");
});

app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).send("Error collecting metrics");
  }
});

app.use("/api/status", (req, res) => res.send("Server is live"));

app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);


await connectDB();

const PORT = Number(process.env.PORT) || 8000;

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the other process or set a different PORT in .env.`
    );
    process.exit(1);
  }

  console.error("Server startup failed:", error.message);
  process.exit(1);
});

server.listen(PORT, () =>
  console.log(`Server is running on PORT: ${PORT} => http://localhost:${PORT}/api/status`)
);


export default server;
