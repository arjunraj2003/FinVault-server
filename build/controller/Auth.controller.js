"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const Auth_Service_1 = require("../service/Auth.Service");
const auth_1 = require("../utils/auth");
const apiResponse_1 = require("../utils/apiResponse");
const class_transformer_1 = require("class-transformer");
// import { checkLoginAttempts, resetLoginAttempts } from "../service/AuthLimiter.service";
class AuthController {
    static async register(req, res, next) {
        try {
            const { name, email, password } = req.body;
            const exists = await Auth_Service_1.UserService.getUserByEmail(email);
            if (exists)
                throw new Error("Email already exists");
            const hashedPassword = await auth_1.AuthService.hashPassword(password);
            const user = await Auth_Service_1.UserService.createUser(name, email, hashedPassword);
            return res
                .status(201)
                .json(new apiResponse_1.ApiResponse(true, "User registered", (0, class_transformer_1.instanceToPlain)(user)));
        }
        catch (err) {
            next(err);
        }
    }
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const user = await Auth_Service_1.UserService.getUserByEmail(email);
            if (!user)
                throw new Error("Invalid credentials");
            // const limiter=await checkLoginAttempts(user.id);
            // if(limiter.blocked){
            //     throw new Error(`Too many attempts. Try again in ${limiter.ttl} seconds.`)
            // }
            const isMatch = await auth_1.AuthService.comparePassword(password, user.password);
            if (!isMatch)
                throw new Error("Invalid credentials");
            const accessToken = auth_1.AuthService.generateAccessToken(user.id);
            const refreshToken = auth_1.AuthService.generateRefreshToken(user.id);
            // Store refreshToken in cookie
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });
            // await resetLoginAttempts(user.id);
            return res.json(new apiResponse_1.ApiResponse(true, "Login successful", { user: (0, class_transformer_1.instanceToPlain)(user), accessToken }));
        }
        catch (err) {
            next(err);
        }
    }
    static async logout(req, res, next) {
        try {
            res.clearCookie("refreshToken");
            return res.json(new apiResponse_1.ApiResponse(true, "Logged out"));
        }
        catch (err) {
            next(err);
        }
    }
    static async refresh(req, res, next) {
        try {
            const token = req.cookies.refreshToken;
            if (!token)
                throw new Error("No refresh token");
            const data = auth_1.AuthService.verifyRefreshToken(token);
            const accessToken = auth_1.AuthService.generateAccessToken(data.userId);
            return res.json(new apiResponse_1.ApiResponse(true, "Token refreshed", { accessToken }));
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=Auth.controller.js.map