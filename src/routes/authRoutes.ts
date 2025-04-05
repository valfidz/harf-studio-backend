import express, { Router } from "express";
import {
  userRegister,
  userLogin,
  authVerify,
  verifyTokenCookies,
  userLogout,
  isEmailAvailable,
} from "../controllers/authController";
import { validate } from "../utils/zod";
import { registerSchema, loginSchema } from "../helpers/validation";

const authRouter: Router = express.Router();

authRouter.post("/register", validate(registerSchema), userRegister);
authRouter.post("/login", validate(loginSchema), userLogin);
authRouter.post("/isEmailAvailable", isEmailAvailable);
authRouter.get("/verifyTokenCookies", verifyTokenCookies);
authRouter.post("/verify", authVerify);
authRouter.post("/logout", userLogout);

export default authRouter;
