import { Request, Response, NextFunction } from "express";
import { UserService } from "../service/Auth.Service";
import { AuthService } from "../utils/auth";
import { ApiResponse } from "../utils/apiResponse";
import { instanceToPlain } from "class-transformer";
import { ApiError } from "../utils/apiError";
import { User } from "../entity/user.entity";

const isProd = process.env.NODE_ENV === "production";

export const authCookieBase = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" as const : "lax" as const,
};

const cookieOptions = {
  ...authCookieBase,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export function issueSession(res: Response, user: User) {
    const accessToken = AuthService.generateAccessToken(user.id);
    const refreshToken = AuthService.generateRefreshToken(user.id);
    res.cookie("refreshToken", refreshToken, cookieOptions);
    return { user: instanceToPlain(user), accessToken };
}

export class AuthController {

    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, email, password } = req.body;

            if (!name || !email || !password) {
                throw new ApiError("Name, email and password are required", 400);
            }

            const exists = await UserService.getUserByEmail(email);
            if (exists) throw new ApiError("Email already exists", 409);

            const hashedPassword = await AuthService.hashPassword(password);
            const user = await UserService.createUser(name, email, hashedPassword);

            return res
                .status(201)
                .json(new ApiResponse(true, "User registered", issueSession(res, user)));
        } catch (err) {
            next(err);
        }
    }

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                throw new ApiError("Email and password are required", 400);
            }

            const user = await UserService.getUserByEmail(email);
            if (!user) throw new ApiError("Invalid credentials", 401);

            const isMatch = await AuthService.comparePassword(password, user.password);
            if (!isMatch) throw new ApiError("Invalid credentials", 401);

            return res.json(
                new ApiResponse(true, "Login successful", issueSession(res, user))
            );
        } catch (err) {
            next(err);
        }
    }

    static async logout(req: Request, res: Response, next: NextFunction) {
        try {
            res.clearCookie("refreshToken", cookieOptions); // ✅ pass same options so browser clears correctly
            return res.json(new ApiResponse(true, "Logged out"));
        } catch (err) {
            next(err);
        }
    }

    static async refresh(req: Request, res: Response, next: NextFunction) {
        try {
            const token = req.cookies.refreshToken;
            if (!token) throw new ApiError("No refresh token", 401);

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
