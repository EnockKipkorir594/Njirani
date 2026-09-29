import { Router } from "express";
import { loginHandler, refreshHandler, registerHandler } from "./auth.controller.js";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { UserRole } from "../../generated/prisma/index.js";
import { authLimiter } from '../../middleware/rateLimit.middleware.js';

const authRouter = Router();

// Apply to the whole router (register, login, refresh)
authRouter.use(authLimiter);

//pass in registerhandler to register a new user 
authRouter.post('/register', registerHandler)

//pass in loginhandler to login a existing user 
authRouter.post('/login', loginHandler)

//authenticated route 
authRouter.get('/me' , authenticate, (req, res) => {
    res.json({success: true, user: req.user})
})
//admins route 
authRouter.get('/admin-only', authenticate, requireRole([UserRole.ADMIN]), (req, res) => {
    res.json({success: true, message: 'You are admin'})
})

//refresh handler route 
authRouter.post('/refresh', refreshHandler)

export default authRouter;


