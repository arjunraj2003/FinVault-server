import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountType } from "../entity/account.entity";

const mocks = vi.hoisted(() => ({
    userRepo: {
        findOne: vi.fn(),
    },
    accountRepo: {
        findOne: vi.fn(),
        create: vi.fn((value: unknown) => value),
        save: vi.fn(),
    },
    detailsRepo: {
        create: vi.fn((value: unknown) => value),
        save: vi.fn(),
    },
}));

vi.mock("../config/data-source", () => ({
    AppDataSource: {
        getRepository: (entity: { name: string }) => {
            if (entity.name === "User") return mocks.userRepo;
            if (entity.name === "Account") return mocks.accountRepo;
            return mocks.detailsRepo;
        },
    },
}));

import { AccountService } from "./Account.service";

const user = { id: "user-1", email: "me@finvault.app", name: "Me" };

describe("credit card creation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.userRepo.findOne.mockResolvedValue(user);
        mocks.accountRepo.findOne.mockResolvedValue(null);
        mocks.accountRepo.create.mockImplementation((value: unknown) => value);
        mocks.detailsRepo.create.mockImplementation((value: unknown) => value);
        mocks.accountRepo.save.mockImplementation(async (value: Record<string, unknown>) => ({
            ...value,
            id: "account-1",
        }));
        mocks.detailsRepo.save.mockImplementation(async (value: Record<string, unknown>) => ({
            ...value,
            id: "details-1",
        }));
    });

    it("saves credit card details with the new account id", async () => {
        const account = await AccountService.createAccount(
            user.id,
            "HDFC Card",
            AccountType.CREDIT,
            "2000",
            {
                creditLimit: "10000",
                statementDay: 12,
                dueDay: 2,
                interestRate: "3.5",
            }
        );

        expect(mocks.accountRepo.save).toHaveBeenCalledTimes(1);
        expect(mocks.accountRepo.save.mock.calls[0][0]).not.toHaveProperty("creditCardDetails");
        expect(mocks.detailsRepo.save).toHaveBeenCalledWith(expect.objectContaining({
            accountId: "account-1",
            userId: user.id,
            creditLimit: "10000",
            statementDay: 12,
            dueDay: 2,
            interestRate: "3.5",
        }));
        expect(account.id).toBe("account-1");
        expect(account.creditCardDetails?.accountId).toBe("account-1");
        expect(account.creditCardDetails).not.toHaveProperty("user");
        expect(account.balance).toBe("8000");
    });

    it("does not write credit card details for a checking account", async () => {
        const account = await AccountService.createAccount(
            user.id,
            "Salary",
            AccountType.CHECKING,
            "500",
        );

        expect(mocks.accountRepo.save).toHaveBeenCalledTimes(1);
        expect(mocks.detailsRepo.save).not.toHaveBeenCalled();
        expect(account.creditCardDetails).toBeUndefined();
        expect(account.balance).toBe("500");
    });

    it("rejects initial debt above the credit limit", async () => {
        await expect(AccountService.createAccount(
            user.id,
            "Overlimit Card",
            AccountType.CREDIT,
            "12000",
            {
                creditLimit: "10000",
                statementDay: 1,
                dueDay: 15,
            }
        )).rejects.toThrow("Initial debt cannot exceed credit limit.");

        expect(mocks.accountRepo.save).not.toHaveBeenCalled();
        expect(mocks.detailsRepo.save).not.toHaveBeenCalled();
    });
});
