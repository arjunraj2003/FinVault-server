import webpush, { WebPushError } from "web-push";
import { QueryFailedError } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { vapidConfig } from "../config/vapid";
import { NotificationLog } from "../entity/notification-log.entity";
import { PushSubscription } from "../entity/push-subscription.entity";
import { Budget } from "../entity/budget.entity";
import { BudgetService } from "./Budget.service";
import { ApiError } from "../utils/apiError";

export interface PushPayload {
    title: string;
    body: string;
    url: string;
}

const subscriptionRepo = () => AppDataSource.getRepository(PushSubscription);
const logRepo = () => AppDataSource.getRepository(NotificationLog);

function configuredPush() {
    const config = vapidConfig();
    if (!config) return null;
    webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
    return config;
}

function dayKey(value: Date | string) {
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value).slice(0, 10);
}

function periodKey(budget: Budget) {
    return `${dayKey(budget.startDate)}|${dayKey(budget.endDate)}|${budget.amount}`;
}

function isUniqueViolation(error: unknown) {
    return error instanceof QueryFailedError && (error as QueryFailedError & { driverError?: { code?: string } }).driverError?.code === "23505";
}

export class NotificationService {
    static publicKey() {
        const config = vapidConfig();
        if (!config) throw new ApiError("Push notifications are not configured", 503);
        return config.publicKey;
    }

    static async saveSubscription(userId: string, endpoint: string, p256dh: string, auth: string) {
        const repo = subscriptionRepo();
        const existing = await repo.findOne({ where: { endpoint } });
        if (existing) {
            existing.userId = userId;
            existing.p256dh = p256dh;
            existing.auth = auth;
            return repo.save(existing);
        }

        return repo.save(repo.create({
            endpoint,
            p256dh,
            auth,
            userId,
            user: { id: userId },
        }));
    }

    static async removeSubscription(userId: string, endpoint: string) {
        await subscriptionRepo().delete({ userId, endpoint });
    }

    static async notifyBudgetThresholds(userId: string, categoryId: string, transactionDate: Date) {
        if (!configuredPush()) return;

        const budgets = await AppDataSource.getRepository(Budget)
            .createQueryBuilder("budget")
            .innerJoin("budget.user", "owner")
            .innerJoinAndSelect("budget.category", "category")
            .where("owner.id = :userId", { userId })
            .andWhere("category.id = :categoryId", { categoryId })
            .andWhere("budget.startDate <= CAST(:when AS date)", { when: transactionDate })
            .andWhere("budget.endDate >= CAST(:when AS date)", { when: transactionDate })
            .getMany();

        const budgetService = new BudgetService();
        for (const budget of budgets) {
            const progress = await budgetService.getBudgetProgress(budget.id, userId);
            const percent = progress.progressPercentage;
            const crossed = [80, 100].filter((threshold) => percent >= threshold);
            if (crossed.length === 0) continue;

            const period = periodKey(budget);
            const unsent: number[] = [];
            for (const threshold of crossed) {
                const alreadySent = await logRepo().findOne({
                    where: { userId, kind: "budget", subjectId: budget.id, threshold, periodKey: period },
                });
                if (!alreadySent) unsent.push(threshold);
            }
            if (unsent.length === 0) continue;

            const threshold = Math.max(...unsent);
            const categoryName = budget.category?.name || "Budget";
            const sent = await NotificationService.sendToUser(userId, {
                title: "FinVault",
                body: threshold >= 100
                    ? `${categoryName} budget is full`
                    : `${categoryName} budget is ${Math.round(percent)}% used`,
                url: "/budgets",
            });
            if (sent === 0) continue;

            for (const value of unsent) {
                try {
                    await logRepo().save(logRepo().create({
                        userId,
                        kind: "budget",
                        subjectId: budget.id,
                        threshold: value,
                        periodKey: period,
                        user: { id: userId },
                    }));
                } catch (error) {
                    if (!isUniqueViolation(error)) throw error;
                }
            }
        }
    }

    private static async sendToUser(userId: string, payload: PushPayload) {
        if (!configuredPush()) return 0;
        const subscriptions = await subscriptionRepo().find({ where: { userId } });
        let delivered = 0;

        await Promise.all(subscriptions.map(async (subscription) => {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: subscription.endpoint,
                        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
                    },
                    JSON.stringify(payload)
                );
                delivered += 1;
            } catch (error) {
                const statusCode = error instanceof WebPushError ? error.statusCode : undefined;
                if (statusCode === 404 || statusCode === 410) {
                    await subscriptionRepo().delete({ id: subscription.id });
                    return;
                }
                console.error("Budget push failed", error);
            }
        }));

        return delivered;
    }
}
