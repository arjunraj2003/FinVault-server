import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User } from "../entity/User.entity";
import { AppDataSource } from "../config/data-source";

const userRepo = AppDataSource.getRepository(User);

export class AuthService {
    static async hashPassword(password: string) {
        return bcrypt.hash(password, 10);
    }

    static async comparePassword(raw: string, hash: string) {
        return bcrypt.compare(raw, hash);
    }

    static generateAccessToken(userId: string) {
        return jwt.sign({ userId }, process.env.JWT_SECRET!, {
            expiresIn: "15m",
        });
    }

    static generateRefreshToken(userId: string) {
        return jwt.sign({ userId }, process.env.REFRESH_SECRET!, {
            expiresIn: "7d",
        });
    }

    static verifyRefreshToken(token: string) {
        return jwt.verify(token, process.env.REFRESH_SECRET!);
    }
}
