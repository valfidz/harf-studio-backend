import express from 'express';
import { createSnapPayment,handleNotification } from '../controllers/snapController';
import { validateToken } from '../middlewares/authMiddleware';

const snapRouter = express.Router();

snapRouter.post('/create-payment', validateToken as express.RequestHandler, createSnapPayment);
snapRouter.post('/notification', handleNotification);

export default snapRouter;