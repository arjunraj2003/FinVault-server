"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = void 0;
const apiError_1 = require("../utils/apiError");
const validateBody = (schema) => (req, res, next) => {
    if (!req.body) {
        throw new apiError_1.ApiError("Request body is missing", 400);
    }
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const message = error.details.map((d) => d.message).join(", ");
        throw new apiError_1.ApiError(message, 400);
    }
    next();
};
exports.validateBody = validateBody;
//# sourceMappingURL=body.validator.middleware.js.map