import { Request, Response } from "express";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import midtransConfig from "../config/midtrans";
import { SnapRequest } from "../types/midtrans-client";

export const createSnapToken = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            amount,
            customer_details,
            item_details,
            plan_id,
            user_id,
        } = req.body;
        const callback_url = process.env.CALLBACK_URL || "";

        // Generate a unique order ID
        const orderId = `ORDER-${Date.now()}-${uuidv4().substring(0, 8)}`;

        const baseUrl = midtransConfig.isProduction
            ? "https://app.midtrans.com/snap/v1/transactions"
            : "https://app.sandbox.midtrans.com/snap/v1/transactions";

        const snapRequest: SnapRequest = {
            transaction_details: {
                order_id: orderId,
                gross_amount: amount,
            },
            credit_card: {
                secure: true,
                save_card: true,
            },
            customer_details: customer_details,
            item_details: item_details,
            user_id,
        }

        if (callback_url) {
            snapRequest.callbacks = {
                finish: callback_url,
            };
        }

        const auth = Buffer.from(`${midtransConfig.serverKey}:`).toString("base64");

        const response = await axios.post(
            baseUrl, 
            snapRequest,
            {
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Basic ${auth}`
              }
            }
          );

        // Add metadata for subscription plan
        const responseData = {
            ...response.data,
            order_id: orderId,
            plan_id: plan_id || null
        };

        return res.status(200).json(responseData);
    } catch (error: any) {
        console.error("Error creating Snap token: ", error.message);
        return res.status(500).json({
            status: "error",
            message: "Failed to create Snap token",
            error: error.message,
        });
    }
}

export const handleNotification = async (req: Request, res: Response): Promise<any> => {
    try {
        const notification = req.body;
      
        // Verify notification from Midtrans
        const orderId = notification.order_id;
        const transactionStatus = notification.transaction_status;
        const fraudStatus = notification.fraud_status;
        const savedTokenId = notification.saved_token_id;

        console.log('Received notification:', JSON.stringify(notification, null, 2));

        // Handle based on transaction status
        if (transactionStatus === 'capture') {
            if (fraudStatus === 'challenge') {
                // TODO: handle payment challenged
                console.log(`Transaction ${orderId} is challenged`);
            } else if (fraudStatus === 'accept') {
                // Payment success and card saved
                if (savedTokenId) {
                    console.log(`Transaction ${orderId} is successful with saved token: ${savedTokenId}`);
                    // TODO: Store this savedTokenId in your database associated with the customer
                    // You can use this savedTokenId to create subscription later
                }
            }
        } else if (transactionStatus === 'deny' || 
            transactionStatus === 'cancel' || 
            transactionStatus === 'expire') {
                // Payment failed
                console.log(`Transaction ${orderId} is ${transactionStatus}`);
        } else if (transactionStatus === 'pending') {
            // Payment pending
            console.log(`Transaction ${orderId} is pending`);
        }
        
        return res.status(200).json({ status: 'ok' });
    } catch(error: any) {
        console.error("Error handling notification: ", error.message);
        return res.status(500).json({
            status: "error",
            message: "Failed to handle notification",
            error: error.message,
        });
    }
}
