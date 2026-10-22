import { AppDataSource } from "../config/data-source";
import { TransactionCategory } from "../entity/TransactionCategory.entity";
import { User } from "../entity/user.entity";
import { ApiError } from "../utils/apiError";

export class TransactionCategoryService {

    private static async requireUser(userId: string) {
        const user = await AppDataSource.getRepository(User).findOne({ where: { id: userId } });
        if (!user) throw new ApiError("User not found", 401);
        return user;
    }

    static async createCategory(userId: string, name: string, description?: string) {
        const repo = AppDataSource.getRepository(TransactionCategory);
        const user = await this.requireUser(userId);

        const exists = await repo.findOne({ where: { name, user: { id: userId } } });
        if (exists) throw new Error(`Category "${name}" already exists.`);

        const category = repo.create({ name, description, user, userId: user.id });
        const saved = await repo.save(category);
        delete (saved as { user?: User }).user;
        return saved;
    }

    static async getAllCategories(userId: string) {
        const repo = AppDataSource.getRepository(TransactionCategory);
        return await repo.find({
            where: { isActive: true, user: { id: userId } },
            order: { name: "ASC" },
        });
    }

    static async getCategoryById(id: string, userId: string) {
        const repo = AppDataSource.getRepository(TransactionCategory);
        const category = await repo.findOne({ where: { id, user: { id: userId } } });
        if (!category) throw new ApiError("Category not found", 404);
        return category;
    }

    static async updateCategory(id: string, userId: string, name?: string, description?: string) {
        const repo = AppDataSource.getRepository(TransactionCategory);
        const category = await repo.findOne({ where: { id, user: { id: userId } } });
        if (!category) throw new ApiError("Category not found", 404);

        if (name && name !== category.name) {
            const exists = await repo.findOne({ where: { name, user: { id: userId } } });
            if (exists) throw new Error(`Category "${name}" already exists.`);
            category.name = name;
        }

        if (description !== undefined) category.description = description;

        return await repo.save(category);
    }

    static async deactivateCategory(id: string, userId: string) {
        const repo = AppDataSource.getRepository(TransactionCategory);
        const category = await repo.findOne({ where: { id, user: { id: userId } } });
        if (!category) throw new ApiError("Category not found", 404);

        category.isActive = false;
        await repo.save(category);
        return { message: `Category "${category.name}" deactivated successfully.` };
    }
}
