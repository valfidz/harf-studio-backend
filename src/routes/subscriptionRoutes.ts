import express, { RequestHandler } from 'express';
import {
    createSubscription,
    getCardToken,
    getSubscription,
    getDBSubscription,
    disableSubscription,
    enableSubscription,
    handleSubscriptionNotification
} from '../controllers/subscriptionController';
import { validateToken } from '../middlewares/authMiddleware';

const midtransRouter = express.Router();

// Get Card Token
midtransRouter.post('/getCardToken', getCardToken);

// Create Subscription
midtransRouter.post('/create', validateToken as RequestHandler, createSubscription);

// Get Subscription Details from midtrans
midtransRouter.get('/:id', validateToken as RequestHandler, getSubscription);

// Get Subscription Details from database
midtransRouter.get('/db/:id', validateToken as RequestHandler, getDBSubscription as RequestHandler);

// Disable Subscription
midtransRouter.post('/:id/disable', validateToken as RequestHandler, disableSubscription);

// Enable Subscription
midtransRouter.post('/:id/enable', validateToken as RequestHandler, enableSubscription);

// Get Subscription Notification
midtransRouter.post('/notification', handleSubscriptionNotification);

export default midtransRouter;