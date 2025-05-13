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
  'http://localhost:3000',
  /\.cloudflare\.com$/,
  /\.render\.com$/
];

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Real IP:', req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// Update CORS configuration
app.use(
  cors({
    origin: function(origin, callback) {
      // Allow requests with no origin (like Postman, server-to-server)
      if (!origin) return callback(null, true);

      // Check if origin matches any allowed origin (string or RegExp)
      const isAllowed = allowedOrigins.some(o =>
        typeof o === 'string' ? o === origin : o.test(origin)
      );

      if (isAllowed) {
        callback(null, true);
      } else {
        console.log('Blocked origin:', origin);
        // Instead of throwing, just deny with no CORS headers
        callback(new Error('Not allowed by CORS'), false);
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
      'Access-Control-Request-Headers',
      'CF-Connecting-IP',
      'CF-IPCountry',
      'CF-RAY',
      'True-Client-IP'
    ],
    exposedHeaders: ['Set-Cookie', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);

// Trust proxy settings for Cloudflare and Render
app.set('trust proxy', true);

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
