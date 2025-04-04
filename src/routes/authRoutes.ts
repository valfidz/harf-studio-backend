import express, { Router } from "express";
import {
  userRegister,
  userLogin,
  authVerify,
  verifyTokenCookies,
} from "../controllers/authController";
import { validate } from "../utils/zod";
import { registerSchema, loginSchema } from "../helpers/validation";

const authRouter: Router = express.Router();

authRouter.post("/register", validate(registerSchema), userRegister);
authRouter.post("/login", validate(loginSchema), userLogin);
authRouter.get("/verifyTokenCookies", verifyTokenCookies);
authRouter.post("/verify", authVerify);

export default authRouter;
