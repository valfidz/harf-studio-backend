import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/authRoutes";
import secureRouter from "./routes/encryptionRoutes";
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'https://harp-studio.vercel.app',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }),
);
app.use(cookieParser());
app.use(express.json());

app.use("/auth", authRouter);
app.use("/secure", secureRouter);

export default app;
