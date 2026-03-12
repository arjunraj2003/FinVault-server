"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const API_URL = 'http://localhost:3000/api/v1';
async function runTests() {
    try {
        console.log('--- Setting up Test User ---');
        // 1. Register/Login a test user
        const userData = {
            name: 'Test Budget User',
            email: `test_budget_${Date.now()}@example.com`,
            password: 'password123'
        };
        console.log(`Registering user: ${userData.email}`);
        const regRes = await axios_1.default.post(`${API_URL}/auth/register`, userData);
        const token = regRes.data.data.accessToken;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        console.log('✓ Successfully registered and obtained token');
        // Create an Account for Transactions
        console.log('\n--- Creating an Account ---');
        const accRes = await axios_1.default.post(`${API_URL}/account`, {
            name: "Main Test Checking",
            type: "checking",
            balance: 5000
        }, config);
        const accountId = accRes.data.data.id;
        console.log(`✓ Account created with ID: ${accountId}`);
        // 2. Test Create Budget
        console.log('\n--- Testing: Create Budget ---');
        const budgetPayload = {
            amount: 500,
            category: 'food',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days later
        };
        const createRes = await axios_1.default.post(`${API_URL}/budget`, budgetPayload, config);
        const budgetId = createRes.data.data.id;
        console.log(`✓ Created Budget for 'food' with limit 500. ID: ${budgetId}`);
        // 3. Test Get Budgets
        console.log('\n--- Testing: Get All Budgets ---');
        const getRes = await axios_1.default.get(`${API_URL}/budget`, config);
        console.log(`✓ Retrieved ${getRes.data.data.length} budget(s)`);
        // 4. Test Get Budget By ID
        console.log('\n--- Testing: Get Budget By ID ---');
        const getByIdRes = await axios_1.default.get(`${API_URL}/budget/${budgetId}`, config);
        console.log(`✓ Successfully retrieved budget for category: ${getByIdRes.data.data.category}`);
        // 5. Test Update Budget
        console.log('\n--- Testing: Update Budget ---');
        const updateRes = await axios_1.default.put(`${API_URL}/budget/${budgetId}`, { amount: 600 }, config);
        console.log(`✓ Updated budget amount to: ${updateRes.data.data.amount}`);
        // 6. Test Budget Progress with Transactions
        console.log('\n--- Testing: Budget Progress ---');
        // Add a debit transaction
        await axios_1.default.post(`${API_URL}/transaction`, {
            accountId: accountId,
            type: "debit",
            amount: 50,
            category: "food",
            description: "Groceries",
            transactionDate: new Date().toISOString()
        }, config);
        await axios_1.default.post(`${API_URL}/transaction`, {
            accountId: accountId,
            type: "debit",
            amount: 15.50,
            category: "food",
            description: "Lunch",
            transactionDate: new Date().toISOString()
        }, config);
        console.log("✓ Added $65.50 worth of 'food' transactions");
        // Verify Progress
        const progressRes = await axios_1.default.get(`${API_URL}/budget/progress/${budgetId}`, config);
        const progress = progressRes.data.data;
        console.log(`✓ Budget Progress check:`);
        console.log(`  - Total limit: ${progress.budget.amount}`);
        console.log(`  - Total spent: ${progress.totalSpent}`);
        console.log(`  - Remaining limit: ${progress.remainingLimit}`);
        console.log(`  - Progress percentage: ${progress.progressPercentage}%`);
        if (progress.totalSpent === 65.5) {
            console.log("✅ PROGRESS CALCULATION IS CORRECT!");
        }
        else {
            console.log(`❌ PROGRESS MISMATCH. Expected 65.5, got ${progress.totalSpent}`);
        }
        // 7. Test Delete Budget
        console.log('\n--- Testing: Delete Budget ---');
        await axios_1.default.delete(`${API_URL}/budget/${budgetId}`, config);
        console.log(`✓ Deleted budget ${budgetId}`);
        // Verify Deletion
        try {
            await axios_1.default.get(`${API_URL}/budget/${budgetId}`, config);
            console.log("❌ DELETE TEST FAILED. BUDGET STILL EXISTS.");
        }
        catch (err) {
            if (err.response && err.response.status === 404) {
                console.log("✅ DELETE TEST SUCCESS. BUDGET NOT FOUND.");
            }
            else {
                console.log(`❓ DELETE TEST VERIFICATION FAILED. STATUS: ${err.response?.status}`);
            }
        }
        console.log("\nALL TESTS COMPLETED O.K.");
    }
    catch (error) {
        console.error("\n❌ TEST FAILED:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        }
        else {
            console.error(error.message);
        }
    }
}
runTests();
//# sourceMappingURL=test_budgets.js.map