import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { verifyAccessToken } from "../utils/token";

export interface AuthRequest extends Request{
    user?: {
        id: string,
        name?: string,
        role: string,
        email?:string
    }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith("Bearer " )){
        throw new ApiError('Token missing', 401);
    }

    try {
        const token = authHeader.split(" ")[1];
        const decoded = verifyAccessToken(token);
        if(!decoded){
            return next(new ApiError('Invalid or expired token', 401))
        }
        (req as any).user = decoded;
        next()
    } catch (error) {
        return next(new ApiError('Invalid or expired token', 401))
    }
}

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Forbidden: Access denied' });
      return;
    }
    next();
  };
};