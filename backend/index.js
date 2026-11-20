import express from "express";
import dotenv from "dotenv";
dotenv.config();
import connectDb from "./config/db.js";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import cors from "cors";
import userRouter from "./routes/user.routes.js";
import shopRouter from "./routes/shop.routes.js";
import itemRouter from "./routes/item.routes.js";
import orderRouter from "./routes/order.routes.js";
import adminRouter from "./routes/admin.routes.js";
import adminAuthRouter from "./routes/adminAuth.routes.js";
import couponRouter from "./routes/coupon.routes.js";
import http from "http";
import { Server } from "socket.io";
import { socketHandler } from "./socket.js";
const app = express();

const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "https://snapeats-fjjn.onrender.com",
  process.env.FRONTEND_URL,
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (origin.endsWith(".onrender.com")) return true;
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    callback(null, isAllowedOrigin(origin) ? origin : false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
};

const io = new Server(server, { cors: corsOptions });

app.set("io", io);

const port = process.env.PORT || 5000;
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/shop", shopRouter);
app.use("/api/item", itemRouter);
app.use("/api/order", orderRouter);
app.use("/api/coupon", couponRouter);
app.use("/api/admin/session", adminAuthRouter);
app.use("/api/admin", adminRouter);

socketHandler(io);
const startServer = async () => {
  await connectDb();

  server.listen(port, () => {
    console.log(`Server started at ${port}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
