import express, { Router } from 'express';

const authRouter: Router = express.Router();

authRouter.post('/register');
authRouter.post('/login');
authRouter.post('/verify');

export default authRouter