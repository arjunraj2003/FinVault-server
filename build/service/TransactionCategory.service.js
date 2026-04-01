"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionCategoryService = void 0;
const data_source_1 = require("../config/data-source");
const TransactionCategory_entity_1 = require("../entity/TransactionCategory.entity");
class TransactionCategoryService {
    static async createCategory(name, description) {
        const repo = data_source_1.AppDataSource.getRepository(TransactionCategory_entity_1.TransactionCategory);
        const exists = await repo.findOne({ where: { name } });
        if (exists)
            throw new Error(`Category "${name}" already exists.`);
        const category = repo.create({ name, description });
        return await repo.save(category);
    }
    static async getAllCategories() {
        const repo = data_source_1.AppDataSource.getRepository(TransactionCategory_entity_1.TransactionCategory);
        return await repo.find({
            where: { isActive: true },
            order: { name: "ASC" },
        });
    }
    static async getCategoryById(id) {
        const repo = data_source_1.AppDataSource.getRepository(TransactionCategory_entity_1.TransactionCategory);
        const category = await repo.findOne({ where: { id } });
        if (!category)
            throw new Error(`Category with id "${id}" not found.`);
        return category;
    }
    static async updateCategory(id, name, description) {
        const repo = data_source_1.AppDataSource.getRepository(TransactionCategory_entity_1.TransactionCategory);
        const category = await repo.findOne({ where: { id } });
        if (!category)
            throw new Error(`Category with id "${id}" not found.`);
        if (name && name !== category.name) {
            const exists = await repo.findOne({ where: { name } });
            if (exists)
                throw new Error(`Category "${name}" already exists.`);
            category.name = name;
        }
        if (description !== undefined)
            category.description = description;
        return await repo.save(category);
    }
    static async deactivateCategory(id) {
        const repo = data_source_1.AppDataSource.getRepository(TransactionCategory_entity_1.TransactionCategory);
        const category = await repo.findOne({ where: { id } });
        if (!category)
            throw new Error(`Category with id "${id}" not found.`);
        category.isActive = false;
        await repo.save(category);
        return { message: `Category "${category.name}" deactivated successfully.` };
    }
}
exports.TransactionCategoryService = TransactionCategoryService;
//# sourceMappingURL=TransactionCategory.service.js.map