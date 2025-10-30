const dayjs = require('dayjs');

const DEFAULT_BUDGETS = [
    { category: 'Housing', amount: 1500, period: 'monthly', description: 'Rent, mortgage, property tax' },
    { category: 'Utilities', amount: 350, period: 'monthly', description: 'Electricity, water, internet and other utilities' },
    { category: 'Groceries', amount: 600, period: 'monthly', description: 'Supermarket, market and pantry expenses' },
    { category: 'Dining', amount: 300, period: 'monthly', description: 'Restaurants, cafes and takeout' },
    { category: 'Transport', amount: 250, period: 'monthly', description: 'Fuel, public transport and ride sharing' },
    { category: 'Health', amount: 200, period: 'monthly', description: 'Health insurance, pharmacy, medical visits' },
    { category: 'Entertainment', amount: 200, period: 'monthly', description: 'Subscriptions, movies, events and leisure' },
    { category: 'Travel', amount: 150, period: 'monthly', description: 'Flights, hotels and travel preparations' },
    { category: 'Education', amount: 150, period: 'monthly', description: 'Courses, books and professional development' },
    { category: 'Investments', amount: 400, period: 'monthly', description: 'Brokerage transfers and long term investments' },
    { category: 'Savings', amount: 300, period: 'monthly', description: 'Emergency fund and short term goals' }
];

class DataStore {
    constructor({ budgets = DEFAULT_BUDGETS } = {}) {
        this.transactions = [];
        this.budgetMap = new Map();
        this.nextTransactionId = 1;
        this.lastUpdated = null;

        budgets.forEach((budget) => this.upsertBudget(budget));
    }

    addTransaction(transaction) {
        if (!transaction) {
            throw new Error('Transaction payload is required.');
        }

        const numericAmount = Number(transaction.amount);

        if (!Number.isFinite(numericAmount)) {
            throw new Error('Transaction amount must be a finite number.');
        }

        const date = transaction.date ? dayjs(transaction.date) : dayjs();

        if (!date.isValid()) {
            throw new Error('Transaction date is invalid.');
        }

        const record = {
            id: this.nextTransactionId++,
            date: date.format('YYYY-MM-DD'),
            description: (transaction.description || '').trim(),
            amount: Number(numericAmount.toFixed(2)),
            category: transaction.category || 'Miscellaneous',
            merchant: (transaction.merchant || '').trim(),
            account: (transaction.account || '').trim(),
            tags: Array.isArray(transaction.tags) ? [...transaction.tags] : [],
            metadata: transaction.metadata ? { ...transaction.metadata } : {},
            createdAt: dayjs().toISOString()
        };

        this.transactions.push(record);
        this.lastUpdated = dayjs().toISOString();

        return { ...record };
    }

    addTransactions(transactions) {
        if (!Array.isArray(transactions)) {
            throw new Error('Transactions payload must be an array.');
        }

        return transactions.map((transaction) => this.addTransaction(transaction));
    }

    getTransactions(filters = {}) {
        const { category, from, to } = filters;

        let results = this.transactions.slice();

        if (category) {
            results = results.filter((transaction) => transaction.category === category);
        }

        if (from) {
            const fromDate = dayjs(from);
            if (fromDate.isValid()) {
                const fromValue = fromDate.valueOf();
                results = results.filter((transaction) => dayjs(transaction.date).valueOf() >= fromValue);
            }
        }

        if (to) {
            const toDate = dayjs(to);
            if (toDate.isValid()) {
                const toValue = toDate.valueOf();
                results = results.filter((transaction) => dayjs(transaction.date).valueOf() <= toValue);
            }
        }

        return results.map((transaction) => ({ ...transaction, tags: [...transaction.tags], metadata: { ...transaction.metadata } }));
    }

    upsertBudget(budget) {
        if (!budget || !budget.category) {
            throw new Error('Budget category is required.');
        }

        const amount = Number(budget.amount);

        if (!Number.isFinite(amount) || amount < 0) {
            throw new Error('Budget amount must be a non-negative number.');
        }

        const period = budget.period || 'monthly';

        const stored = {
            category: budget.category,
            amount: Number(amount.toFixed(2)),
            period,
            description: budget.description ? budget.description.trim() : ''
        };

        this.budgetMap.set(budget.category, stored);
        this.lastUpdated = dayjs().toISOString();

        return { ...stored };
    }

    getBudgets() {
        return Array.from(this.budgetMap.values()).map((budget) => ({ ...budget }));
    }

    getBudget(category) {
        if (!category) {
            return undefined;
        }

        const record = this.budgetMap.get(category);
        return record ? { ...record } : undefined;
    }

    reset({ budgets = DEFAULT_BUDGETS } = {}) {
        this.transactions = [];
        this.budgetMap = new Map();
        this.nextTransactionId = 1;
        this.lastUpdated = null;

        budgets.forEach((budget) => this.upsertBudget(budget));
    }
}

module.exports = {
    DataStore,
    DEFAULT_BUDGETS,
    createDefaultStore: () => new DataStore(),
    defaultStore: new DataStore()
};
