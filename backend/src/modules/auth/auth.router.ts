import { registerUser } from "./auth.service.js";
import { Router } from "express";

const authRouter = Router();

authRouter.post('/register', registerUser)

