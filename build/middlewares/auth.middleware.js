"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const apiError_1 = require("../utils/apiError");
const token_1 = require("../utils/token");
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new apiError_1.ApiError('Token missing', 401);
    }
    try {
        const token = authHeader.split(" ")[1];
        const decoded = (0, token_1.verifyAccessToken)(token);
        if (!decoded) {
            return next(new apiError_1.ApiError('Invalid or expired token', 401));
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        return next(new apiError_1.ApiError('Invalid or expired token', 401));
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ message: 'Forbidden: Access denied' });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.middleware.js.map