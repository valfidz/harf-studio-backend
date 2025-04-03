import { Request, Response } from 'express';
import sql from '../config/database';
import bcrypt, { compareSync } from "bcryptjs";
import { generateJWToken, verifyToken } from '../utils/jwt';
import { redis } from '../config/redis';
import { Session } from '../types/token';

export const userRegister = async (req: Request, res: Response): Promise<any> => {
    try {
        // get and checking role value
        const role = req.query.role;

        if (!role) {
            return res.status(400).json({ 
                error: 'Params is missing'
            });
        }

        if (role !== 'business' && role !== 'personal') {
            return res.status(400).json({
                error: 'Params incorrect'
            })
        }

        // get and checking req.body value
        const { name, company_name, email, password } = req.body;

        if (role === 'business' && !company_name) {
            return res.status(400).json({
                error: 'Input parameter is missing'
            })
        }

        if (!name || !email || !password) {
            return res.status(400).json({
                error: 'Input parameter is missing'
            })
        }

        // create hash password
        const salt = bcrypt.genSaltSync(10);
        const hashPassword = bcrypt.hashSync(password, salt);

        const data = await sql`
            INSERT INTO users (name, company_name, email, password, role)
            VALUES (${name}, ${company_name}, ${email}, ${hashPassword}, ${role})
            RETURNING name, company_name, email, password
        `

        // token generation
        const userData = {
            id: data[0].id,
            name: data[0].name,
            company_name: data[0].company_name,
            email: data[0].email,
            role: data[0].role
        }

        const token = generateJWToken(userData);

        if (typeof token === "object" && ("errorCode" in token) && (token.errorCode === "13" || token.errorCode === "14")) {
            return res.status(400).json({
                errorCode: token.errorCode,
                message: token.message
            })
        }

        res.setHeader('Authorization', `Bearer ${token}`);
        await redis.set(`user_session:${userData.id}`, { token: token }, { ex: 86400 });

        // return result
        return res.status(201).json({
            message: `User ${data[0].name} registered successfully!`,
            user_data: data[0]
        })
    } catch (error: any) {
        return res.status(500).json({
            error: error.message
        })
    }
}

export const userLogin = async (req: Request, res: Response): Promise<any> => {
    try {
        // get and check role and req.body value
        const role = req.query.role;
        const { email, password } = req.body;
    
        if (!role) {
            return res.status(400).json({ 
                error: 'Params is missing!'
            });
        }
    
        if (role !== 'business' && role !== 'personal') {
            return res.status(400).json({
                error: 'Params incorrect!'
            })
        }

        if (!email || !password) {
            return res.status(400).json({
                error: 'Credentials is missing!'
            })
        }

        // get user data from database
        const user = await sql`
            SELECT id, name, company_name, email, role, password
            FROM users
            WHERE email = ${email} 
            AND deleted_at IS NULL
        `

        if (!user) {
            return res.status(404).json({
                error: 'User not found!'
            })
        }

        // compare password
        const userData = {
            id: user[0].id,
            name: user[0].name,
            company_name: user[0].company_name,
            email: user[0].email,
            role: user[0].role
        }

        const isMatch = await bcrypt.compare(password, user[0]?.password)

        if (!isMatch) {
            return res.status(400).json({
                error: 'Invalid credentials!'
            })
        }

        if (user[0].role !== role) {
            return res.status(403).json({
                error: 'You are not authorized to access this page!'
            })
        }

        // check session on redis
        const session = await redis.get<Session>(`user_session:${userData.id}`);
        let token;

        if (!session) {
            // token generation
            const generateToken = generateJWToken(userData);
            await redis.set(`user_session:${userData.id}`, { token: generateToken }, { ex: 86400 });

            if (typeof generateToken === "object" && ("errorCode" in generateToken) && (generateToken.errorCode === "13" || generateToken.errorCode === "14")) {
                return res.status(400).json({
                    errorCode: generateToken.errorCode,
                    message: generateToken.message
                })
            }

            token = generateToken;
        } else {
            token = session.token;
        }
        res.setHeader('Authorization', `Bearer ${token}`);

        // return result
        return res.status(200).json({
            message: 'Login successful!',
            token
        })
    } catch (error: any) {
        return res.status(500).json({
            error: error.message
        })
    }
}

export const authVerify = async (req: Request, res: Response): Promise<any> => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                message: 'Token is missing'
            })
        }

        const validate = verifyToken(token)

        if (!validate.valid) {
            return res.status(500).json({
                valid: validate.valid,
                error: validate.error
            })
        }

        return res.status(200).json({
            valid: validate.valid,
            name: validate.decoded?.name,
            company_name: validate.decoded?.company_name,
            email: validate.decoded?.email,
            role: validate.decoded?.role,
        })
    } catch (error: any) {
        return res.status(500).json({
            error: error.message
        })
    }
}