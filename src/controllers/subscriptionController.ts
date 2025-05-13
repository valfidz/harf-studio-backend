import { Request, Response } from "express";
import axios from "axios";
import midtransConfig from "../config/midtrans";
import { CardDetails, CustomerDetails, SubscriptionRequest } from "../types/midtrans-client";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import sql from "../config/database";
import { start } from "repl";
import { subscriptionLogger, subscriptionNotificationLogger } from "../config/logger";

dotenv.config();

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
            payment_type,
            saved_token_id,
            customer_details,
            metadata
        } = req.body;
        const interval = process.env.SUBS_INTERVAL || "month";

        const now = new Date();
        const formattedDate = now.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: 'Asia/Jakarta'
        }).replace(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+)/, '$3-$1-$2 $4:$5:$6 +0700');

        // const schedule = {
        //     interval: 1,
        //     interval_unit: "month",
        //     max_interval: 12,
        //     start_time: new Date().toISOString(),
        // };

        // const retry_schedule = {
        //     interval: 1,
        //     interval_unit: "day",
        //     max_interval: 3,
        // }

        const baseUrl = midtransConfig.isProduction
            ? "https://api.midtrans.com"
            : "https://api.sandbox.midtrans.com";

        const subscriptionPayload: SubscriptionRequest = {
            name,
            amount,
            currency: currency || 'IDR',
            payment_type,
            token: saved_token_id,
            schedule: {
                interval: 1,
                interval_unit: interval,
                max_interval: 12,
                // start_time: formattedDate
            },
            retry_schedule: {
                interval: 1,
                interval_unit: "day",
                max_interval: 3
            },
            metadata,
            customer_details: customer_details as CustomerDetails,
        };

        // console.log("Subs payload: ", subscriptionPayload);

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

        console.log("Subscription response: ", response.data);
        subscriptionLogger.info("Subscription response: ", response.data);

        return res.status(200).json(response.data);
    } catch (error: any) {
        console.error("Error creating subscription: ", error.message);
        subscriptionLogger.error("Error creating subscription: ", error.message);

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
        // let trx_id;
      
        // Log the notification
        console.log('Subscription notification:', JSON.stringify(notification, null, 2));
        subscriptionNotificationLogger.info('Subscription notification: ', notification);
        
        // Process based on subscription status
        const subscriptionId = notification.subscription.id;
        // const new_trx_id = uuidv4();
        const status = notification.subscription.status;
        // const transaction_id = notification.transaction?.transaction_id || null;
        let transaction_id;

        if (notification.event_name === "subscription.create") {
            transaction_id = notification.subscription.metadata.pg_trx_id;
        }

        if (notification.event_name === "subscription.charge") {
            transaction_id = notification.transaction.transaction_id;
        }


        // if (!transaction_id) {
        //     transaction_id = `${Date.now()}-${uuidv4().substring(0, 8)}`;
        // }

        // if (!transaction_id) {
        //     trx_id = new_trx_id;
        // } else {
        //     trx_id = transaction_id;
        // }

        console.log("transaction id: ", transaction_id);

        const name = notification.subscription.name;
        const amount = notification.subscription.amount;
        const currency = notification.subscription.currency;
        const start_time = notification.subscription.schedule.start_time;
        const next_charge = notification.subscription.schedule.next_execution_at;
        const token = notification.subscription.token;
        // const email = notification.subscription.customer_details.email;
        const user_id = notification.subscription.metadata.user_id;
        const plan_id = notification.subscription.metadata.plan_id;
        
        // TODO: Update your database with subscription status

        // Create query for create new subscription

        // Create query for update subscription after recharge

        // Add subscription
        const save_subs = await sql`
            INSERT INTO subscriptions (amount, status, start_time, token, user_id, md_subscription_id, next_charge, plan_id)
            VALUES (${amount}, ${status}, ${start_time}, ${token}, ${user_id}, ${subscriptionId}, ${next_charge}, ${plan_id})
            RETURNING id, amount, status, start_time, token, user_id, md_subscription_id, next_charge, plan_id
        `

        // console.log("Subscription: ", save_subs[0]);

        const db_subs_id = save_subs[0].id;

        // Add subscription history
        const subs_history = await sql`
            INSERT INTO subscription_histories (pg_trx_id, subscription_id, status)
            VALUES (${transaction_id}, ${db_subs_id}, ${status})
            RETURNING id, pg_trx_id, subscription_id, status
        `

        // console.log("Subscription history: ", subs_history[0]);
        
        return res.status(200).json({ status: 'ok' });
    } catch (error: any) {
        console.error("Error handling subscription notification: ", error.message);
        subscriptionNotificationLogger.error("Error handling subscription notification: ", error.message);

        return res.status(500).json({ 
            status: "error",
            message: "Failed to handle subscription notification",
            error: error.message,
         });
    }
}