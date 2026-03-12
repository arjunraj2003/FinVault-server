"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_entity_1 = require("../entity/user.entity");
const data_source_1 = require("../config/data-source");
const userRepo = data_source_1.AppDataSource.getRepository(user_entity_1.User);
class AuthService {
    static async hashPassword(password) {
        return bcrypt_1.default.hash(password, 10);
    }
    static async comparePassword(raw, hash) {
        return bcrypt_1.default.compare(raw, hash);
    }
    static generateAccessToken(userId) {
        return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, {
            expiresIn: "15m",
        });
    }
    static generateRefreshToken(userId) {
        return jsonwebtoken_1.default.sign({ userId }, process.env.REFRESH_SECRET, {
            expiresIn: "7d",
        });
    }
    static verifyRefreshToken(token) {
        return jsonwebtoken_1.default.verify(token, process.env.REFRESH_SECRET);
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.js.map