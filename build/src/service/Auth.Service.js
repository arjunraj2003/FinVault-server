"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const data_source_1 = require("../config/data-source");
const User_entity_1 = require("../entity/User.entity");
const userRepo = data_source_1.AppDataSource.getRepository(User_entity_1.User);
class UserService {
    static async createUser(name, email, password) {
        const newUser = userRepo.create({ name, email, password });
        return userRepo.save(newUser);
    }
    static async getUserByEmail(email) {
        return userRepo.findOne({ where: { email } });
    }
    static async getUserById(id) {
        return userRepo.findOne({ where: { id } });
    }
}
exports.UserService = UserService;
//# sourceMappingURL=Auth.Service.js.map