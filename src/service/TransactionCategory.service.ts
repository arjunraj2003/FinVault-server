import { AppDataSource } from "../config/data-source";
import { TransactionCategory } from "../entity/TransactionCategory.entity";

export class TransactionCategoryService {

    static async createCategory(name: string, description?: string) {
        const repo = AppDataSource.getRepository(TransactionCategory);

        
        const exists = await repo.findOne({ where: { name } });
        if (exists) throw new Error(`Category "${name}" already exists.`);

        const category = repo.create({ name, description });
        return await repo.save(category);
    }

    static async getAllCategories() {
        const repo = AppDataSource.getRepository(TransactionCategory);
        return await repo.find({
            where: { isActive: true },
            order: { name: "ASC" },
        });
    }

    static async getCategoryById(id: string) {
        const repo = AppDataSource.getRepository(TransactionCategory);
        const category = await repo.findOne({ where: { id } });
        if (!category) throw new Error(`Category with id "${id}" not found.`);
        return category;
    }

    static async updateCategory(id: string, name?: string, description?: string) {
        const repo = AppDataSource.getRepository(TransactionCategory);
        const category = await repo.findOne({ where: { id } });
        if (!category) throw new Error(`Category with id "${id}" not found.`);

        if (name && name !== category.name) {
            const exists = await repo.findOne({ where: { name } });
            if (exists) throw new Error(`Category "${name}" already exists.`);
            category.name = name;
        }

        if (description !== undefined) category.description = description;

        return await repo.save(category);
    }

    static async deactivateCategory(id: string) {
        const repo = AppDataSource.getRepository(TransactionCategory);
        const category = await repo.findOne({ where: { id } });
        if (!category) throw new Error(`Category with id "${id}" not found.`);

        category.isActive = false;
        await repo.save(category);
        return { message: `Category "${category.name}" deactivated successfully.` };
    }
}