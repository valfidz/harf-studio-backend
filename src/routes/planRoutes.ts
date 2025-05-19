import express, { RequestHandler } from 'express';
import { validateToken } from '../middlewares/authMiddleware';
import {
    getPlans,
    getPlanById,
    createPlan,
    updatePlan,
    deletePlan
} from '../controllers/plansController';

const planRouter = express.Router();

// Get all plans
planRouter.get('/', getPlans);

// Get plan by ID
planRouter.get('/:id', getPlanById);

// Create a new plan
planRouter.post('/create', validateToken as RequestHandler, createPlan);

// Update plan by ID
planRouter.patch('/update/:id', validateToken as RequestHandler, updatePlan);

// Delete plan by ID
planRouter.delete('/delete/:id', validateToken as RequestHandler, deletePlan)

export default planRouter;