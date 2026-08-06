import bcrypt from "bcrypt";
import prisma from "../../config/database.js";
import { ConflictError } from "../../utils/errors.js";
import { RegisterInput } from "./auth.schema.js";

export async function registerUser(data: RegisterInput) {
    const existingEmail = await prisma.user.findUnique({
        where: {email: data.email},
    });

    if (existingEmail){
        throw new ConflictError('Email is already registered');
    }
    const existingPhone = await prisma.user.findUnique({
        where: {phone:data.phone},
    })

    if (existingPhone){
        throw new ConflictError('Phone number is already registered')
    }

    const passwordHash = await bcrypt.hash(data.password, 12)

    const user = await prisma.user.create({

        data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            passwordHash,
            role: data.role,

        },

    });

    const {passwordHash: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
}



