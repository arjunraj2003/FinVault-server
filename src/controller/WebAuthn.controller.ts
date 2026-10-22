import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { getAuthUserId } from "../middlewares/auth.middleware";
import { UserService } from "../service/Auth.Service";
import { WebAuthnService } from "../service/WebAuthn.service";
import { authCookieBase, issueSession } from "./Auth.controller";
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/server";

const CHALLENGE_COOKIE = "webauthnChallenge";

const challengeCookieOptions = {
    ...authCookieBase,
    maxAge: 5 * 60 * 1000,
    path: "/api/v1/auth/webauthn",
};

function requestOrigin(req: Request) {
    const origin = req.get("origin");
    return origin || undefined;
}

function rememberChallenge(res: Response, challenge: string) {
    res.cookie(CHALLENGE_COOKIE, challenge, challengeCookieOptions);
}

function takeChallenge(req: Request, res: Response) {
    const challenge = req.cookies?.[CHALLENGE_COOKIE];
    res.clearCookie(CHALLENGE_COOKIE, {
        httpOnly: challengeCookieOptions.httpOnly,
        secure: challengeCookieOptions.secure,
        sameSite: challengeCookieOptions.sameSite,
        path: challengeCookieOptions.path,
    });
    if (!challenge || typeof challenge !== "string") {
        throw new ApiError("Fingerprint challenge expired. Try again.", 400);
    }
    return challenge;
}

export class WebAuthnController {
    static async registerOptions(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await UserService.getUserById(getAuthUserId(req));
            if (!user) throw new ApiError("User not found", 401);

            const options = await WebAuthnService.registrationOptions(user, requestOrigin(req));
            rememberChallenge(res, options.challenge);
            res.status(200).json(new ApiResponse(true, "Fingerprint setup started", options));
        } catch (error) {
            next(error);
        }
    }

    static async registerVerify(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await UserService.getUserById(getAuthUserId(req));
            if (!user) throw new ApiError("User not found", 401);

            const saved = await WebAuthnService.verifyRegistration(
                user,
                req.body as RegistrationResponseJSON,
                takeChallenge(req, res),
                requestOrigin(req)
            );
            res.status(201).json(new ApiResponse(true, "Fingerprint is ready on this phone", saved));
        } catch (error) {
            next(error);
        }
    }

    static async loginOptions(req: Request, res: Response, next: NextFunction) {
        try {
            const credentialId = typeof req.body?.credentialId === "string" ? req.body.credentialId : undefined;
            const options = await WebAuthnService.loginOptions(credentialId, requestOrigin(req));
            rememberChallenge(res, options.challenge);
            res.status(200).json(new ApiResponse(true, "Fingerprint unlock started", options));
        } catch (error) {
            next(error);
        }
    }

    static async loginVerify(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await WebAuthnService.verifyLogin(
                req.body as AuthenticationResponseJSON,
                takeChallenge(req, res),
                requestOrigin(req)
            );
            res.status(200).json(new ApiResponse(true, "Login successful", issueSession(res, user)));
        } catch (error) {
            next(error);
        }
    }

    static async remove(req: Request, res: Response, next: NextFunction) {
        try {
            const { credentialId } = req.body ?? {};
            if (!credentialId || typeof credentialId !== "string") {
                throw new ApiError("credentialId is required", 400);
            }
            await WebAuthnService.remove(getAuthUserId(req), credentialId);
            res.status(200).json(new ApiResponse(true, "Fingerprint unlock turned off"));
        } catch (error) {
            next(error);
        }
    }
}
