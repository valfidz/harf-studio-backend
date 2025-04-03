import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { TokenResponse } from '../types/token';
import { UserPayload } from '../types/user';

dotenv.config();

export const generateJWToken = (userData: UserPayload): TokenResponse => {
    try {
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            return {
                errorCode: "13",
                message: "Credentials is missing"
            };
        }
        const token = jwt.sign({
            userData
        }, secret, { expiresIn: '24h' });

        return token;
    } catch (error: any) {
        return {
            errorCode: "14",
            message: `Failed to generate token ${error.message}`
        };
    }
};

export const verifyToken = (token: string): { valid: boolean; decoded?: UserPayload; error?: string } => {
    try {
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            return {
                valid: false,
                error: "JWT secret is missing"
            };
        }
        
        const decoded = jwt.verify(token, secret) as { userData: UserPayload };
        
        return {
            valid: true,
            decoded: decoded.userData
        };
    } catch (error: any) {
        return {
            valid: false,
            error: error.message
        };
    }
}