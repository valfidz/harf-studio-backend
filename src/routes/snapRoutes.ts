import express from 'express';
import { createSnapToken,handleNotification } from '../controllers/snapController';

const snapRouter = express.Router();

snapRouter.post('/create-token', createSnapToken);
snapRouter.post('/notification', handleNotification);

export default snapRouter;