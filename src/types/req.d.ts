import { Request } from "express";

export interface AuthRequest extends Request {
    user?: {
        name: string;
        company_name?: string | null;
        email: string;
        role: string;
    };
}