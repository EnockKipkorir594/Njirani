import { Router } from "express";
import { loginHandler, registerHandler } from "./auth.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const authRouter = Router();

//pass in registerhandler to register a new user 
authRouter.post('/register', registerHandler)

//pass in loginhandler to login a existing user 
authRouter.post('/login', loginHandler)

//authenticated route 
authRouter.get('/me' , authenticate, (req, res) => {
    res.json({success: true, user: req.user})
})

export default authRouter;

