import { Router } from "express";
import {z} from "zod";
import * as authController from "../controllers/authController";
import {validate} from "../middleware/validate";
import { authenticate } from "../middleware/auth";

const router = Router();

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1).max(100)
})

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
})

router.post('/register',validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/profile',authenticate, authController.getProfile);

export default router;