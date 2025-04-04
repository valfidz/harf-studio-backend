import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ALGORITHM = "aes-256-cbc";
const SECRET_KEY = Buffer.from(process.env.ENCRYPT_SECRET || "tDRnRJj0dAWMtZfB5ebag5IJO1FVlwnI");
const STATIC_IV = Buffer.from(process.env.ENCRYPT_STATIC || "1234567890123456");

export const encryptKey = async (text: string) => {
    try {
        const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, STATIC_IV);
        let encrypted = cipher.update(text, 'utf-8', 'hex');

        encrypted += cipher.final("hex");

        return encrypted;
    } catch (error: any) {
        throw new Error("Encryption failed")
    }
}

export const decryptKey = async (encryptedText: string) => {
    try {
        const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, STATIC_IV);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf-8');

        decrypted += decipher.final("utf-8");

        return decrypted;
    } catch (error: any) {
        throw new Error("Decryption failed");
    }
}