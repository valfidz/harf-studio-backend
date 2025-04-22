import { Request, Response } from "express";
import axios from "axios";
import midtransConfig from "../config/midtrans";
import { CardDetails, CustomerDetails, SubscriptionRequest } from "../types/midtrans-client";

// Get Card Token
export const getCardToken = async (req: Request, res: Response): Promise<any> => {
    try {
        const cardDetails: CardDetails = req.body;

        const baseUrl = midtransConfig.isProduction
            ? "https://api.midtrans.com"
            : "https://api.sandbox.midtrans.com";

        const response = await axios.get(`${baseUrl}/v2/token`, {
            params: {
                client_key: midtransConfig.clientKey,
                card_number: cardDetails.card_number,
                card_exp_month: cardDetails.card_exp_month,
                card_exp_year: cardDetails.card_exp_year,
                card_cvv: cardDetails.card_cvv,
            }
        });

        return res.status(200).json(response.data);
    } catch (error: any) {
        console.error("Error getting card token: ", error.message);
        return res.status(500).json({ 
            status: "error",
            message: "Failed to get card token",
            error: error.message,
         });
    }
}

//  Create Subscription
export const createSubscription = async (req: Request, res: Response): Promise<any> => {
    try {
        const { 
            name,
            amount,
            currency,
            saved_token_id,
            schedule,
            retry_schedule,
            customer_details,
            metadata
        } = req.body;

        const baseUrl = midtransConfig.isProduction
            ? "https://api.midtrans.com"
            : "https://api.sandbox.midtrans.com";

        const subscriptionPayload: SubscriptionRequest = {
            name,
            amount,
            currency: currency || 'IDR',
            payment_type: "credit_card",
            token: saved_token_id,
            schedule,
            retry_schedule,
            metadata,
            customer_details: customer_details as CustomerDetails,
        };

        console.log("Subs payload: ", subscriptionPayload);

        const auth = Buffer.from(`${midtransConfig.serverKey}:`).toString("base64");

        const response = await axios.post(
            `${baseUrl}/v1/subscriptions`,
            subscriptionPayload, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Basic ${auth}`,
            }
        });

        return res.status(200).json(response.data);
    } catch (error: any) {
        console.error("Error creating subscription: ", error.message);
        return res.status(500).json({ 
            status: "error",
            message: "Failed to create subscription",
            error: error.message,
         });
    }
}

// Get Subscription
export const getSubscription = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        const baseUrl = midtransConfig.isProduction
            ? "https://api.midtrans.com"
            : "https://api.sandbox.midtrans.com";

        const auth = Buffer.from(`${midtransConfig.serverKey}:`).toString("base64");

        const response = await axios.get(
            `${baseUrl}/v1/subscriptions/${id}`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Basic ${auth}`,
            }
        });

        return res.status(200).json(response.data);
    } catch (error: any) {
        console.error("Error getting subscription: ", error.message);
        return res.status(500).json({ 
            status: "error",
            message: "Failed to get subscription",
            error: error.message,
         });
    }
}

// Disable Subscription
export const disableSubscription = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        const baseUrl = midtransConfig.isProduction
            ? "https://api.midtrans.com"
            : "https://api.sandbox.midtrans.com";

        const auth = Buffer.from(`${midtransConfig.serverKey}:`).toString("base64");

        const response = await axios.post(
            `${baseUrl}/v1/subscriptions/${id}/disable`,
            {},
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Basic ${auth}`,
                }
            }
        );

        return res.status(200).json(response.data);
    } catch (error: any) {
        console.error("Error disabling subscription: ", error.message);
        return res.status(500).json({ 
            status: "error",
            message: "Failed to disable subscription",
            error: error.message,
         });
    }
}

// Enable Subscription
export const enableSubscription = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        const baseUrl = midtransConfig.isProduction
            ? "https://api.midtrans.com"
            : "https://api.sandbox.midtrans.com";

        const auth = Buffer.from(`${midtransConfig.serverKey}:`).toString("base64");

        const response = await axios.post(
            `${baseUrl}/v1/subscriptions/${id}/enable`,
            {},
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Basic ${auth}`,
                }
            }
        );

        return res.status(200).json(response.data);
    } catch (error: any) {
        console.error("Error enabling subscription: ", error.message);
        return res.status(500).json({ 
            status: "error",
            message: "Failed to enable subscription",
            error: error.message,
         });
    }
}

export const handleSubscriptionNotification = async (req: Request, res: Response): Promise<any> => {
    try {
        const notification = req.body;
      
        // Log the notification
        console.log('Subscription notification:', JSON.stringify(notification, null, 2));
        
        // Process based on subscription status
        const subscriptionId = notification.id;
        const status = notification.status;
        
        // TODO: Update your database with subscription status
        
        return res.status(200).json({ status: 'ok' });
    } catch (error: any) {
        console.error("Error handling subscription notification: ", error.message);
        return res.status(500).json({ 
            status: "error",
            message: "Failed to handle subscription notification",
            error: error.message,
         });
    }
}