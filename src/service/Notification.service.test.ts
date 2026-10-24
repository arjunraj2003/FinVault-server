import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const budgetQuery = {
        innerJoin: vi.fn(),
        innerJoinAndSelect: vi.fn(),
        where: vi.fn(),
        andWhere: vi.fn(),
        getMany: vi.fn(),
    };

    return {
        budgetQuery,
        subscriptions: {
            find: vi.fn(),
            findOne: vi.fn(),
            save: vi.fn(async (value: unknown) => value),
            create: vi.fn((value: unknown) => value),
            delete: vi.fn(),
        },
        logs: {
            findOne: vi.fn(),
            save: vi.fn(async (value: unknown) => value),
            create: vi.fn((value: unknown) => value),
        },
        getBudgetProgress: vi.fn(),
        sendNotification: vi.fn(),
        setVapidDetails: vi.fn(),
        vapidConfig: vi.fn(),
    };
});

vi.mock("web-push", () => {
    class WebPushError extends Error {
        statusCode: number;
        constructor(message: string, statusCode: number) {
            super(message);
            this.statusCode = statusCode;
        }
    }

    return {
        default: {
            setVapidDetails: mocks.setVapidDetails,
            sendNotification: mocks.sendNotification,
        },
        WebPushError,
    };
});

vi.mock("../config/vapid", () => ({
    vapidConfig: mocks.vapidConfig,
}));

vi.mock("../config/data-source", () => ({
    AppDataSource: {
        getRepository: (entity: { name: string }) => {
            if (entity.name === "Budget") {
                return { createQueryBuilder: () => mocks.budgetQuery };
            }
            if (entity.name === "PushSubscription") return mocks.subscriptions;
            return mocks.logs;
        },
    },
}));

vi.mock("./Budget.service", () => ({
    BudgetService: class {
        getBudgetProgress = mocks.getBudgetProgress;
    },
}));

import { WebPushError } from "web-push";
import { NotificationService } from "./Notification.service";

const budget = {
    id: "budget-1",
    amount: "1000.00",
    startDate: "2026-10-01",
    endDate: "2026-10-31",
    category: { id: "cat-1", name: "Food" },
};

const subscription = {
    id: "sub-1",
    endpoint: "https://push.example/1",
    p256dh: "key",
    auth: "auth",
};

function chainBudgetQuery() {
    mocks.budgetQuery.innerJoin.mockReturnValue(mocks.budgetQuery);
    mocks.budgetQuery.innerJoinAndSelect.mockReturnValue(mocks.budgetQuery);
    mocks.budgetQuery.where.mockReturnValue(mocks.budgetQuery);
    mocks.budgetQuery.andWhere.mockReturnValue(mocks.budgetQuery);
}

async function notify(percent: number) {
    mocks.getBudgetProgress.mockResolvedValue({ progressPercentage: percent });
    await NotificationService.notifyBudgetThresholds("user-1", "cat-1", new Date("2026-10-10T00:00:00.000Z"));
}

function sentBody() {
    const payload = mocks.sendNotification.mock.calls[0]?.[1] as string;
    return JSON.parse(payload).body as string;
}

describe("budget push alerts", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        chainBudgetQuery();
        mocks.vapidConfig.mockReturnValue({
            publicKey: "public-key",
            privateKey: "private-key",
            subject: "mailto:test@finvault.app",
        });
        mocks.budgetQuery.getMany.mockResolvedValue([budget]);
        mocks.logs.findOne.mockResolvedValue(null);
        mocks.subscriptions.find.mockResolvedValue([subscription]);
        mocks.sendNotification.mockResolvedValue({ statusCode: 201 });
    });

    it("does nothing when push keys are not configured", async () => {
        mocks.vapidConfig.mockReturnValue(null);

        await notify(90);

        expect(mocks.budgetQuery.getMany).not.toHaveBeenCalled();
        expect(mocks.sendNotification).not.toHaveBeenCalled();
    });

    it("stays quiet below 80 percent", async () => {
        await notify(79.9);

        expect(mocks.sendNotification).not.toHaveBeenCalled();
        expect(mocks.logs.save).not.toHaveBeenCalled();
    });

    it("sends the 80 percent alert once and remembers it", async () => {
        await notify(86.4);

        expect(sentBody()).toBe("Food budget is 86% used");
        expect(mocks.logs.save).toHaveBeenCalledTimes(1);
        expect(mocks.logs.save).toHaveBeenCalledWith(expect.objectContaining({
            userId: "user-1",
            kind: "budget",
            subjectId: "budget-1",
            threshold: 80,
            periodKey: "2026-10-01|2026-10-31|1000.00",
        }));
    });

    it("sends the full alert when one debit crosses both thresholds", async () => {
        await notify(100);

        expect(sentBody()).toBe("Food budget is full");
        expect(mocks.logs.save.mock.calls.map((call) => call[0].threshold)).toEqual([80, 100]);
    });

    it("sends only the full alert after the 80 percent alert was already sent", async () => {
        mocks.logs.findOne.mockImplementation(async ({ where }: { where: { threshold: number } }) => {
            return where.threshold === 80 ? { id: "already" } : null;
        });

        await notify(100);

        expect(sentBody()).toBe("Food budget is full");
        expect(mocks.logs.save).toHaveBeenCalledTimes(1);
        expect(mocks.logs.save).toHaveBeenCalledWith(expect.objectContaining({ threshold: 100 }));
    });

    it("does not repeat an alert in the same budget period", async () => {
        mocks.logs.findOne.mockResolvedValue({ id: "already" });

        await notify(95);

        expect(mocks.sendNotification).not.toHaveBeenCalled();
    });

    it("does not remember an alert when this user has no phone subscribed", async () => {
        mocks.subscriptions.find.mockResolvedValue([]);

        await notify(90);

        expect(mocks.sendNotification).not.toHaveBeenCalled();
        expect(mocks.logs.save).not.toHaveBeenCalled();
    });

    it("drops a subscription the push service no longer recognizes", async () => {
        mocks.sendNotification.mockRejectedValue(new WebPushError("gone", 410));

        await notify(90);

        expect(mocks.subscriptions.delete).toHaveBeenCalledWith({ id: "sub-1" });
        expect(mocks.logs.save).not.toHaveBeenCalled();
    });

    it("keeps the subscription when the push service has a temporary failure", async () => {
        mocks.sendNotification.mockRejectedValue(new Error("network"));
        vi.spyOn(console, "error").mockImplementation(() => undefined);

        await notify(90);

        expect(mocks.subscriptions.delete).not.toHaveBeenCalled();
        expect(mocks.logs.save).not.toHaveBeenCalled();
    });

    it("moves an existing browser subscription to the signed-in user", async () => {
        const existing = { ...subscription, userId: "old-user", p256dh: "old", auth: "old" };
        mocks.subscriptions.findOne.mockResolvedValue(existing);

        await NotificationService.saveSubscription("user-1", subscription.endpoint, "next-key", "next-auth");

        expect(existing.userId).toBe("user-1");
        expect(existing.p256dh).toBe("next-key");
        expect(mocks.subscriptions.save).toHaveBeenCalledWith(existing);
    });

    it("refuses the public key when push is not configured", () => {
        mocks.vapidConfig.mockReturnValue(null);

        expect(() => NotificationService.publicKey()).toThrow("Push notifications are not configured");
    });
});
