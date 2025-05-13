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

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// Update CORS configuration
app.use(
  cors({
    origin: function(origin, callback) {
      // Allow requests with no origin (like Postman)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        console.log('Blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Allow-Headers',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Set-Cookie', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);

// Add error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message,
      status: err.status
    }
  });
});

// app.use(
//   cors({
//     origin: "*",
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//     allowedHeaders: [
//       'Content-Type', 
//       'Authorization',
//       'X-Requested-With',
//       'Accept',
//       'Origin'
//     ],
//     exposedHeaders: ['Set-Cookie']
//   })
// );
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
