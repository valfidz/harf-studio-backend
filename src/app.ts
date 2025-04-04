import express from 'express';
import cors from 'cors';
import authRouter from './routes/authRoutes';
import secureRouter from './routes/encryptionRoutes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);
app.use('/secure', secureRouter);

export default app;