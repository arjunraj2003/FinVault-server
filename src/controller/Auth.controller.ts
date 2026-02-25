import { Request, Response, NextFunction } from "express";
import { UserService } from "../service/Auth.Service";
import { AuthService } from "../utils/auth";
import { ApiResponse } from "../utils/apiResponse";
import { instanceToPlain } from "class-transformer";
import { checkLoginAttempts, resetLoginAttempts } from "../service/AuthLimiter.service";


export class AuthController {

    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, email, password } = req.body;

            const exists = await UserService.getUserByEmail(email);
            if (exists) throw new Error("Email already exists");

            const hashedPassword = await AuthService.hashPassword(password);

            const user = await UserService.createUser(name, email, hashedPassword);

            return res
                .status(201)
                .json(new ApiResponse(true, "User registered", instanceToPlain(user) ));
        } catch (err) {
            next(err);
        }
    }

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;

            const user = await UserService.getUserByEmail(email);
            if (!user) throw new Error("Invalid credentials");

            const limiter=await checkLoginAttempts(user.id);
            if(limiter.blocked){
                throw new Error(`Too many attempts. Try again in ${limiter.ttl} seconds.`)
            }

            const isMatch = await AuthService.comparePassword(password, user.password);
            if (!isMatch) throw new Error("Invalid credentials");

            const accessToken = AuthService.generateAccessToken(user.id);
            const refreshToken = AuthService.generateRefreshToken(user.id);

            // Store refreshToken in cookie
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });
            await resetLoginAttempts(user.id);
            return res.json(
                new ApiResponse(true, "Login successful", {user:instanceToPlain(user), accessToken })
            );
        } catch (err) {
            next(err);
        }
    }

    static async logout(req: Request, res: Response, next: NextFunction) {
        try {
            res.clearCookie("refreshToken");
            return res.json(new ApiResponse(true, "Logged out"));
        } catch (err) {
            next(err);
        }
    }

    static async refresh(req: Request, res: Response, next: NextFunction) {
        try {
            const token = req.cookies.refreshToken;
            if (!token) throw new Error("No refresh token");

            const data = AuthService.verifyRefreshToken(token) as any;

            const accessToken = AuthService.generateAccessToken(data.userId);

            return res.json(
                new ApiResponse(true, "Token refreshed", { accessToken })
            );
        } catch (err) {
            next(err);
        }
    }
}
