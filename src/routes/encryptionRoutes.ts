import express, { Router, Request, Response } from 'express';
import { encryptKey, decryptKey } from '../utils/encrypt';

const secureRouter: Router = express.Router();

secureRouter.post('/encrypt', async (req: Request, res: Response): Promise<any> => {
    try {
        const { value } = req.body;
        const encrypted = await encryptKey(value);

        return res.status(200).json({
            message: "Encryption success!",
            value: encrypted
        })
    } catch (error: any) {
        return res.status(500).json({
            message: "Encryption failed " + error.message
        })
    }
})

secureRouter.post('/decrypt', async (req: Request, res: Response): Promise<any> => {
    try {
        const { value } = req.body;
        const decrypted = await decryptKey(value);

        return res.status(200).json({
            message: "Decryption success!",
            value: decrypted
        })
    } catch (error: any) {
        return res.status(500).json({
            message: "Decryption failed " + error.message
        })
    }
})

export default secureRouter