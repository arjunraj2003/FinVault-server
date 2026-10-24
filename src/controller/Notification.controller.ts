import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { getAuthUserId } from "../middlewares/auth.middleware";
import { NotificationService } from "../service/Notification.service";

export class NotificationController {
    static publicKey(_req: Request, res: Response, next: NextFunction) {
        try {
            res.status(200).json(new ApiResponse(true, "Push key", {
                publicKey: NotificationService.publicKey(),
            }));
        } catch (error) {
            next(error);
        }
    }

    static async subscribe(req: Request, res: Response, next: NextFunction) {
        try {
            const endpoint = req.body?.endpoint;
            const p256dh = req.body?.keys?.p256dh;
            const auth = req.body?.keys?.auth;
            if (typeof endpoint !== "string" || typeof p256dh !== "string" || typeof auth !== "string") {
                throw new ApiError("A push subscription is required", 400);
            }

            await NotificationService.saveSubscription(getAuthUserId(req), endpoint, p256dh, auth);
            res.status(201).json(new ApiResponse(true, "Budget alerts are on"));
        } catch (error) {
            next(error);
        }
    }

    static async unsubscribe(req: Request, res: Response, next: NextFunction) {
        try {
            const endpoint = req.body?.endpoint;
            if (typeof endpoint !== "string" || !endpoint) {
                throw new ApiError("endpoint is required", 400);
            }
            await NotificationService.removeSubscription(getAuthUserId(req), endpoint);
            res.status(200).json(new ApiResponse(true, "Budget alerts are off"));
        } catch (error) {
            next(error);
        }
    }
}
