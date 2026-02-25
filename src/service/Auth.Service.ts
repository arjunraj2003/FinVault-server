import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User.entity";

const userRepo = AppDataSource.getRepository(User);

export class UserService {
    static async createUser(name: string, email: string, password: string) {
        const newUser = userRepo.create({ name, email, password });
        
        return userRepo.save(newUser);
    }

    static async getUserByEmail(email: string) {
        return userRepo.findOne({ where: { email } });
    }

    static async getUserById(id: string) {
        return userRepo.findOne({ where: { id } });
    }
}
