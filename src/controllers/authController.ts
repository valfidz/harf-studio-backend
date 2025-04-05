import { Request, Response } from "express";
import sql from "../config/database";
import bcrypt, { compareSync } from "bcryptjs";
import { generateJWToken, verifyToken } from "../utils/jwt";
import { redis } from "../config/redis";
import { Session } from "../types/token";
import { encryptKey } from "../utils/encrypt";
import jwt from "jsonwebtoken";
import { validatePassword } from "../helpers/validation";

export const userRegister = async (req: Request, res: Response): Promise<any> => {
  try {
    // get and checking req.body value
    const { name, company_name, email, password } = req.body;
    const role = "member";
    const method = req.query.method ? req.query.method : "";

    if (method != "oauth" && method != "standard") {
      return res.status(400).json({
        error: "Registration method invalid!",
      });
    }

    if (method === "oauth") {
      if (!name || !email) {
        return res.status(400).json({
          error: "Input parameter is missing!",
        });
      }
    } else if (method === "standard") {
      if (!name || !email || !password) {
        return res.status(400).json({
          error: "Input parameter is missing",
        });
      }
    
      const passwordError = validatePassword(password);
      if (passwordError) {
        return res.status(400).json({
          error: passwordError,
        });
      }
    }

    // create hash password
    const salt = bcrypt.genSaltSync(10);
    const hashPassword = bcrypt.hashSync(password, salt);

    const data = await sql`
            INSERT INTO users (name, company_name, email, password, role, method)
            VALUES (${name}, ${company_name}, ${email}, ${hashPassword}, ${role}, ${method})
            RETURNING id, name, company_name, email, role, method
        `;

    // token generation
    const userData = {
      id: data[0].id,
      name: data[0].name,
      company_name: data[0].company_name,
      email: data[0].email,
      role: data[0].role,
      method: data[0].method
    };

    // encrypt email for redis key
    const encryptMail = await encryptKey(email);

    const token = generateJWToken(userData);

    if (
      typeof token === "object" &&
      "errorCode" in token &&
      (token.errorCode === "13" || token.errorCode === "14")
    ) {
      return res.status(400).json({
        errorCode: token.errorCode,
        message: token.message,
      });
    }

    res.setHeader("Authorization", `Bearer ${token}`);
    await redis.set(`user_session:${encryptMail}`, { token: token }, { ex: 86400 });

    // return result
    return res.status(201).json({
      message: `User ${data[0].name} registered successfully!`,
      user_data: data[0],
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message,
    });
  }
};

export const userLogin = async (req: Request, res: Response): Promise<any> => {
  try {
    // get and check req.body value
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Credentials is missing!",
      });
    }

    // encrypt email for redis key
    const encryptMail = await encryptKey(email);

    // check session on redis
    const session = await redis.get<Session>(`user_session:${encryptMail}`);
    let token;

    if (!session) {
      // get user data from database
      const user = await sql`
                SELECT id, name, company_name, email, role, password
                FROM users
                WHERE email = ${email} 
                AND deleted_at IS NULL
            `;

      if (!user) {
        return res.status(404).json({
          error: "User not found!",
        });
      }

      // compare password
      const userData = {
        id: user[0].id,
        name: user[0].name,
        company_name: user[0].company_name,
        email: user[0].email,
        role: user[0].role,
      };

      const isMatch = await bcrypt.compare(password, user[0]?.password);

      if (!isMatch) {
        return res.status(400).json({
          error: "Invalid credentials!",
        });
      }

      // token generation
      const generateToken = generateJWToken(userData);
      await redis.set(`user_session:${encryptMail}`, { token: generateToken }, { ex: 86400 });

      if (
        typeof generateToken === "object" &&
        "errorCode" in generateToken &&
        (generateToken.errorCode === "13" || generateToken.errorCode === "14")
      ) {
        return res.status(400).json({
          errorCode: generateToken.errorCode,
          message: generateToken.message,
        });
      }

      token = generateToken;
    } else {
      token = session.token;
    }

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.setHeader("Authorization", `Bearer ${token}`);

    // return result
    return res.status(200).json({
      message: "Login successful!",
      token,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message,
    });
  }
};

export const authVerify = async (req: Request, res: Response): Promise<any> => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "Token is missing",
      });
    }

    const validate = verifyToken(token);

    if (!validate.valid) {
      return res.status(500).json({
        valid: validate.valid,
        error: validate.error,
      });
    }

    return res.status(200).json({
      valid: validate.valid,
      name: validate.decoded?.name,
      company_name: validate.decoded?.company_name,
      email: validate.decoded?.email,
      role: validate.decoded?.role,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message,
    });
  }
};

export const verifyTokenCookies = async (req: Request, res: Response): Promise<any> => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Not authenticated!" });

  try {
    const decoded = jwt.verify(token, String(process.env.JWT_SECRET));
    res.json({ user: decoded });
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired, please login again" });
      }
    }
    res.status(403).json({ message: "Invalid token" });
  }
};
