import bcrypt from "bcrypt";
import prisma from "../../config/database.js";
import { ConflictError } from "../../utils/errors.js";
import { RegisterInput } from "./auth.schema.js";
import { signAccessToken, signRefreshToken } from "../../utils/jwt.js";
import { UnauthorizedError } from "../../utils/errors.js";



//Register User function
export async function registerUser(data: RegisterInput) {
    //check for a duplicate email in prisma
    const existingEmail = await prisma.user.findUnique({
        where: {email: data.email},
    });
    //throw an error if email already exists
    if (existingEmail){
        throw new ConflictError('Email is already registered');
    }
    //check for a duplicate phone number in prisma
    const existingPhone = await prisma.user.findUnique({
        where: {phone:data.phone},
    })
    //throw error if duplicate phone number exiss
    if (existingPhone){
        throw new ConflictError('Phone number is already registered')
    }
    //hash user provided password using bcrypt 
    const passwordHash = await bcrypt.hash(data.password, 12)
    //create user 
    const user = await prisma.user.create({

        data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            passwordHash,
            role: data.role,

        },

    });

    //removes the hashed password and returns the user details
    const {passwordHash: _, ...userWithoutPassword } = user;

    return userWithoutPassword;

}
//login user function 
export async function loginUser(email: string, password:string){

    //FInd user by email 
    const user = await prisma.user.findUnique({
        where: { email: email}
    })
    //return error if user does not exist 
    if (!user){
        throw new UnauthorizedError('Invalid credentials');

    }
    //Check if th user passed in the right password
    const checkPassword = await bcrypt.compare(password, user.passwordHash)
    //Return an error if the password is wrong 
    if (!checkPassword){
        throw new UnauthorizedError('Invalid credentials')

    }

    //remove passwordHash 
    const {passwordHash: _, ...userWithoutPassword } = user;

    //pass in userid and role inside the payload 
    const payload = {userId: user.id, role: user.role}

    //sign access and refresh tokens 
    const accessToken  = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)

    //send the user with password and the refresh and access tokens
    return {userWithoutPassword, accessToken, refreshToken};
    
    




}




