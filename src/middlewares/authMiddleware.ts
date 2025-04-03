import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { AuthRequest } from "../types/req";

export const verifyTokenBusiness = (req: AuthRequest, res: Response, next: NextFunction): any => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: 'Unauthorized: Token is missing or expired'
            });
        }

        const validate = verifyToken(token);

        if (!validate.valid) {
            return res.status(403).json({
                valid: validate.valid,
                error: validate.error
            });
        }
        console.log("validate", validate.decoded?.name)

        if (validate.decoded?.role.toLowerCase() !== 'business') {
            return res.status(401).json({
                message: 'Unauthorized: You do not have permission to access this page'
            })
        }

        // Attach user data to request object
        req.user = validate.decoded;
        
        next();
    } catch (error: any) {
        return res.status(500).json({
            error: error.message
        });
    }
};

export const verifyTokenPersonal = (req: AuthRequest, res: Response, next: NextFunction): any => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: 'Unauthorized: Token is missing or expired'
            });
        }

        const validate = verifyToken(token);

        if (!validate.valid) {
            return res.status(403).json({
                valid: validate.valid,
                error: validate.error
            });
        }
        console.log("validate", validate.decoded?.name)

        if (validate.decoded?.role.toLowerCase() !== 'personal') {
            return res.status(401).json({
                message: 'Unauthorized: You do not have permission to access this page'
            })
        }

        // Attach user data to request object
        req.user = validate.decoded;
        
        next();
    } catch (error: any) {
        return res.status(500).json({
            error: error.message
        });
    }
};