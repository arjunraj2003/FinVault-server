"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPassordResetToken = exports.generatePassordResetToken = exports.verifyRefreshToken = exports.generateRefreshToken = exports.verifyAccessToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const apiError_1 = require("./apiError");
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
// ----------  ACCESS TOKEN  ----------
const generateAccessToken = (payload) => {
    try {
        return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    }
    catch (error) {
        console.log(error);
    }
};
exports.generateAccessToken = generateAccessToken;
const verifyAccessToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        throw new apiError_1.ApiError("Invalid or expired access token", 401);
    }
};
exports.verifyAccessToken = verifyAccessToken;
const generateRefreshToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
};
exports.generateRefreshToken = generateRefreshToken;
const verifyRefreshToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, REFRESH_SECRET);
    }
    catch (error) {
        throw new apiError_1.ApiError("Invalid or expired access token", 401);
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
const generatePassordResetToken = (payload, secret) => {
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: '7d' });
};
exports.generatePassordResetToken = generatePassordResetToken;
const verifyPassordResetToken = (token, secret) => {
    try {
        return jsonwebtoken_1.default.verify(token, secret);
    }
    catch (error) {
        throw new apiError_1.ApiError("Invalid or expired access token", 401);
    }
};
exports.verifyPassordResetToken = verifyPassordResetToken;
//# sourceMappingURL=token.js.map