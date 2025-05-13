import { Request, Response } from "express";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import midtransConfig from "../config/midtrans";
import { SnapRequest } from "../types/midtrans-client";
import { redis } from "../config/redis";
import { encryptKey } from "../utils/encrypt";
import sql from "../config/database";
import dotenv from "dotenv";
import { stat } from "fs";
import { C } from "@upstash/redis/zmscore-BdNsMd17";
import { dateNow, dateNextExecution } from "../helpers/date";
import { paymentNotificationLogger, snapTokenLogger } from "../config/logger";

dotenv.config();

export const createSnapToken = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            customer_details,
            user_id,
            plan_id,
            quantity
        } = req.body;
        const interval = process.env.SUBS_INTERVAL || "month";

        const callback_url = process.env.CALLBACK_URL || "";

        if (quantity <= 0 || typeof quantity !== "number") {
            return res.status(400).json({
                status: "error",
                message: "Invalid quantity",
            })
        }

        // Generate a unique order ID
        const orderId = `ORDER-${Date.now()}-${uuidv4().substring(0, 8)}`;

        // Get subscription plan details from database
        const plan = await sql`
            SELECT * FROM subscription_plans
            WHERE id = ${plan_id}
            AND deleted_at IS NULL`

        if (!plan) {
            return res.status(404).json({
                status: "error",
                message: "Subscription plan not found",
            })
        }

        const name = plan[0].name;
        const amount = Number(plan[0].price) * Number(quantity);

        // Get metadata from data plan based on plan_id
        const metadata = {
            description: `Subscription plan for ${name}`,
        }

        const item_details = {
            id: plan[0].id.toString(),
            price: Number(plan[0].price),
            quantity: Number(quantity),
            name: plan[0].name,
        };

        // Send request data required for create subscription to redis for later use
        const requestData = {
            name,
            amount,
            customer_details,
            metadata,
            user_id,
            plan_id,
            order_id: orderId,
        };
        const encryptUserId = await encryptKey(user_id);

        await redis.set(`subsRequest:${encryptUserId}`, requestData, { ex: 10800 });

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
            recurring: {
                required: true,
                // start_time: dateNow,
                interval_unit: interval,
            }
        }

        if (callback_url) {
            snapRequest.callbacks = {
                finish: callback_url,
            };
        }

        const auth = Buffer.from(`${midtransConfig.serverKey}:`).toString("base64");
        console.log("Base url: ", baseUrl);
        console.log("Request data: ", snapRequest);
        console.log("Authorization: ", auth);

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
        
        if (!response) {
            return res.status(400).json({
                status: "error",
                message: "Something's wrong with the request",
            });
        }

        if (response) {
            console.log("Transaction created successfully: ", response.data);
            snapTokenLogger.info("Transaction created successfully: ", {
                response: response.data,
                order_id: orderId,
            })
        }


        //   if (response) {
        //     const save_transaction = await sql`
        //         INSERT INTO transaction_histories (order_id, plan_id, quantity, user_id)
        //         VALUES (${orderId}, ${item_details.id}, ${item_details.quantity}, ${user_id})
        //         RETURNING id, order_id, plan_id, quantity, user_id
        //     `
        //     if (!save_transaction) {
        //         return res.status(400).json({
        //             status: "error",
        //             message: "Failed to save transaction",
        //         });
        //     } else {
        //         // console.log("Transaction saved successfully!", save_transaction[0]);
        //         console.log("Transaction saved successfully!");
        //     }
        //   }

        // Add metadata for subscription plan
        const responseData = {
            ...response.data,
            order_id: orderId,
        };

        return res.status(200).json(responseData);
    } catch (error: any) {
        console.error("Error creating Snap token: ", error.message);
        snapTokenLogger.error("Error creating snap token: ", error.message);

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
        let save_token;
        let save_payment;
        let status;
        let message;

        console.log('Received notification:', JSON.stringify(notification, null, 2));
        paymentNotificationLogger.info('Received snap notification: ', notification);
      
        // Verify notification from Midtrans
        const orderId = notification.order_id;
        const subscription_id = notification.subscription_id;
        const transactionStatus = notification.transaction_status;
        const fraudStatus = notification.fraud_status;
        const gross_amount = notification.gross_amount;
        const pg_trx_id = notification.transaction_id;
        const payment_type = notification.payment_type;
        const user_id = notification.metadata?.extra_info?.user_id ?? notification.metadata?.user_id;
        let savedTokenId = notification.saved_token_id;

        console.log("order_id", orderId);

        if (!user_id) {
            throw new Error('User ID not found in notification metadata');
        }

        // Get data request for create subscription
        const encryptUserId = await encryptKey(user_id);
        const redis_subs_request: any = await redis.get(`subsRequest:${encryptUserId}`);

        if (!redis_subs_request) {
            return res.status(400).json({
                status: "error",
                message: "Failed to get request data from redis",
            })
        }

        // Check if saved_token_id is exist in database
        if (!savedTokenId) {
            const savedToken = await sql`
                SELECT saved_token_id FROM saved_payment_info
                WHERE user_id = ${user_id} AND deleted_at IS NULL
                ORDER BY created_at DESC
                LIMIT 1
            `

            savedTokenId = savedToken[0].saved_token_id;
        }

        const exist_token = await sql`
            SELECT saved_token_id from saved_payment_info
            WHERE saved_token_id = ${savedTokenId}
            AND deleted_at IS NULL
        `

        if (exist_token.length === 0) {
            save_token = await sql`
                INSERT INTO saved_payment_info (user_id, saved_token_id)
                VALUES (${user_id}, ${savedTokenId})
                RETURNING id, user_id, saved_token_id
            `
            if (!save_token) {
                return res.status(400).json({
                    status: "error",
                    message: "Failed to save payment information",
                });
            }
            console.log("Payment information saved successfully", save_token[0]);
        }

        // console.log('Received notification:', JSON.stringify(notification, null, 2));

        const check_order = !orderId.startsWith("ORDER-");

        // if (!check_order) {
        //     console.log("check 1");
        //     const plan_id = notification.metadata.plan_id;
        //     const quantity = 1;
        //     const create_transaction = await sql`
        //         INSERT INTO transaction_histories (order_id, plan_id, quantity, user_id)
        //         VALUES (${orderId}, ${plan_id}, ${quantity}, ${user_id})
        //         RETURNING id, order_id, plan_id, quantity, user_id
        //     `

        //     if (!create_transaction) {
        //         return res.status(400).json({
        //             status: "error",
        //             message: "Failed to save transaction",
        //         });
        //     } else {
        //         // console.log("Transaction saved successfully!", create_transaction[0]);
        //         console.log("Transaction saved successfully!");
        //     }
        // }

        save_payment = await sql`
            INSERT INTO payment_histories (order_id, transaction_status, fraud_status, gross_amount, pg_trx_id, user_id)
            VALUES (${orderId}, ${transactionStatus}, ${fraudStatus}, ${gross_amount}, ${pg_trx_id}, ${user_id})
            RETURNING id, order_id, transaction_status, fraud_status, gross_amount, pg_trx_id, user_id
        `

        if (!save_payment) {
            return res.status(400).json({
                status: "error",
                message: "Failed to save payment information",
            });
        }
        // console.log("Payment information saved successfully", save_payment[0]);

        // Data object for create subscription
        const reqData = {
            name: redis_subs_request.name,
            amount: redis_subs_request.amount,
            customer_details: redis_subs_request.customer_details,
            payment_type,
            saved_token_id: savedTokenId,
            metadata: {
                description: redis_subs_request.metadata.description,
                user_id: redis_subs_request.user_id,
                plan_id: redis_subs_request.plan_id,
                order_id: redis_subs_request.order_id,
                pg_trx_id: pg_trx_id,
            },
        }

        // console.log("Subscription request data", reqData);

        // Handle based on transaction status
        if (transactionStatus === 'capture') {
            if (fraudStatus === 'challenge') {
                // TODO: handle payment challenged
                status = "Failed";
                message = "Transaction is challenged";
                console.log(`Transaction ${orderId} is challenged`);
            } else if (fraudStatus === 'accept') {
                // Payment success and card saved
                if (savedTokenId && reqData) {
                    console.log(`Transaction ${orderId} is successful with saved token: ${savedTokenId}`);
                    try {
                        // Call subscription creation endpoint
                        const response = await axios.post(
                            `${process.env.BASE_URL}/subscriptions/create`,
                            reqData,
                            {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json',
                                }
                            }
                        );

                        status = "Success";
                        message = "Transaction is successful";
                        console.log("Subscription created successfully: ", response.data);
                    } catch (error: any) {
                        status = "Failed";
                        message = "Failed to create subscription";
                        console.error("Error creating subscription: ", error.message);
                    }
                }
            }
        } else if (transactionStatus === 'deny' || transactionStatus === 'cancel' || transactionStatus === 'expire') {
            // Payment failed
            status = "Failed";
            message = "Transaction failed";
            console.log(`Transaction ${orderId} is ${transactionStatus}`);
        } else if (transactionStatus === 'pending') {
            // Payment pending
            status = "Pending";
            message = "Transaction is pending";
            console.log(`Transaction ${orderId} is pending`);
        }
        
        return res.status(200).json({ 
            status: status,
            message: message,
        });
    } catch(error: any) {
        console.error("Error handling notification: ", error.message);
        paymentNotificationLogger.error("Error handling notification: ", error.message);

        return res.status(500).json({
            status: "error",
            message: "Failed to handle notification",
            error: error.message,
        });
    }
}
