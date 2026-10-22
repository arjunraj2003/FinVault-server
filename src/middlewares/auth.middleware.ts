import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { verifyAccessToken } from "../utils/token";

export interface AuthRequest extends Request {
    user?: {
        userId: string;
    };
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new ApiError("Token missing", 401));
    }

    try {
        const token = authHeader.split(" ")[1];
        const decoded = verifyAccessToken(token) as { userId?: string } | undefined;
        if (!decoded?.userId || typeof decoded.userId !== "string") {
            return next(new ApiError("Invalid or expired token", 401));
        }
        (req as AuthRequest).user = { userId: decoded.userId };
        next();
    } catch (error) {
        return next(new ApiError("Invalid or expired token", 401));
    }
};

export function getAuthUserId(req: object): string {
    const userId = (req as AuthRequest).user?.userId;
    if (!userId) {
        throw new ApiError("Unauthorized", 401);
    }
    return userId;
}
