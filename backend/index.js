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
import http from "http";
import { Server } from "socket.io";
import { socketHandler } from "./socket.js";
const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.set("io", io);

const port = process.env.PORT || 5000;
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/shop", shopRouter);
app.use("/api/item", itemRouter);
app.use("/api/order", orderRouter);

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
