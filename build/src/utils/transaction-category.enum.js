"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionType = exports.TransactionCategory = void 0;
var TransactionCategory;
(function (TransactionCategory) {
    TransactionCategory["FOOD"] = "food";
    TransactionCategory["RENT"] = "rent";
    TransactionCategory["SALARY"] = "salary";
    TransactionCategory["TRANSPORT"] = "transport";
    TransactionCategory["SHOPPING"] = "shopping";
    TransactionCategory["UTILITIES"] = "utilities";
    TransactionCategory["ENTERTAINMENT"] = "entertainment";
    TransactionCategory["INVESTMENT"] = "investment";
    TransactionCategory["HEALTH"] = "health";
    TransactionCategory["OTHER"] = "other";
})(TransactionCategory || (exports.TransactionCategory = TransactionCategory = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["CREDIT"] = "credit";
    TransactionType["DEBIT"] = "debit";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
//# sourceMappingURL=transaction-category.enum.js.map