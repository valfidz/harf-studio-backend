import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/authRoutes";
import secureRouter from "./routes/encryptionRoutes";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

app.use("/auth", authRouter);
app.use("/secure", secureRouter);

export default app;
