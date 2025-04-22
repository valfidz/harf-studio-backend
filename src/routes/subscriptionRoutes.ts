import express from 'express';
import {
    createSubscription,
    getCardToken,
    getSubscription,
    disableSubscription,
    enableSubscription,
    handleSubscriptionNotification
} from '../controllers/subscriptionController';

const midtransRouter = express.Router();

// Get Card Token
midtransRouter.post('/getCardToken', getCardToken);

// Create Subscription
midtransRouter.post('/create', createSubscription);

// Get Subscription Details
midtransRouter.get('/:id', getSubscription);

// Disable Subscription
midtransRouter.post('/:id/disable', disableSubscription);

// Enable Subscription
midtransRouter.post('/:id/enable', enableSubscription);

// Get Subscription Notification
midtransRouter.post('/notification', handleSubscriptionNotification);

export default midtransRouter;