import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/authRoutes";
import secureRouter from "./routes/encryptionRoutes";
import midtransRouter from "./routes/subscriptionRoutes";
import snapRouter from "./routes/snapRoutes";
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL || "https://harp-studio.vercel.app",
  process.env.BACKEND_URL || "https://harf-studio-backend.onrender.com",
  'http://localhost:3000'
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    exposedHeaders: ['Set-Cookie']
  })
);
app.use(cookieParser());
app.use(express.json());

app.use("/auth", authRouter);
app.use("/secure", secureRouter);
app.use("/subscriptions", midtransRouter);
app.use("/snap", snapRouter);

app.get("/checkhealth", (req, res) => {
  res.send("Backend Harf Studio 1.0 OK");
});

export default app;
