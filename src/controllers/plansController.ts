import { Request, Response } from "express";
import sql from "../config/database";

export const getPlans = async (req: Request, res: Response): Promise<any> => {
    try {
        const products = await sql`
            SELECT id, name, price, currency 
            FROM subscription_plans
            WHERE deleted_at IS NULL`

        if (products.length === 0) {
            return res.status(404).json({ message: "No products found" });
        }

        return res.status(200).json(products);
    } catch (error: any) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: "Failed to fetch products" });
    }
}

export const getPlanById = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        const product = await sql`
            SELECT id, name, price, currency 
            FROM subscription_plans
            WHERE id = ${id} AND deleted_at IS NULL`

        if (product.length === 0) {
            return res.status(404).json({ message: "Product not found" });
        }

        return res.status(200).json(product[0]);
    } catch (error: any) {
        console.error("Error fetching product:", error);
        res.status(500).json({ message: "Failed to fetch product" });
    }
}

export const createPlan = async (req: Request, res: Response): Promise<any> => {
    try {
        const { name, price, currency } = req.body;
        if (!name || !price || !currency) {
            return res.status(400).json({ message: "Required filed is missing" });
        }
        const upperCurrency = currency.toUpperCase();

        if (upperCurrency !== "IDR" && upperCurrency !== "USD") {
            return res.status(400).json({ message: "Currency must be IDR or USD" });
        }

        const planPrice = parseInt(price);

        const createPlan = await sql`
            INSERT INTO subscription_plans (name, price, currency)
            VALUES (${name}, ${planPrice}, ${currency})
            RETURNING id, name, price, currency`

        if (!createPlan) {
            return res.status(500).json({ message: "Failed to create subscription plan" });
        }

        return res.status(201).json({
            message: "Subscription plan created successfully",
            data: createPlan[0],
        });
    } catch (error: any) {
        console.error("Error creating product:", error);
        res.status(500).json({ message: "Failed to create product" });
    }
}

export const updatePlan = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { name, price, currency } = req.body;

        if (!name || !price || !currency) {
            return res.status(400).json({ message: "Required filed is missing" });
        }

        const upperCurrency = currency.toUpperCase();

        if (upperCurrency !== "IDR" && upperCurrency !== "USD") {
            return res.status(400).json({ message: "Currency must be IDR or USD" });
        }

        const planPrice = parseInt(price);

        const updatePlan = await sql`
            UPDATE subscription_plans
            SET name = ${name}, price = ${planPrice}, currency = ${currency}
            WHERE id = ${id} AND deleted_at IS NULL
            RETURNING id, name, price, currency`

        if (!updatePlan) {
            return res.status(500).json({ message: "Failed to update subscription plan" });
        }

        return res.status(200).json({
            message: "Subscription plan updated successfully",
            data: updatePlan[0],
        });
    } catch (error: any) {
        console.error("Error updating product:", error);
        res.status(500).json({ message: "Failed to update product" });
    }
}

export const deletePlan = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        const deletePlan = await sql`
            UPDATE subscription_plans
            SET deleted_at = NOW()
            WHERE id = ${id} AND deleted_at IS NULL
            `

        if (!deletePlan) {
            return res.status(500).json({ message: "Failed to delete subscription plan" });
        }

        return res.status(200).json({
            message: "Subscription plan deleted successfully",
        });
    } catch (error: any) {
        console.error("Error deleting product:", error);
        res.status(500).json({ message: "Failed to delete product" });
    }
}