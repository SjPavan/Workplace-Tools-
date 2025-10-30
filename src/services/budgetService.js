const dayjs = require('dayjs');

class BudgetService {
    constructor(store) {
        if (!store) {
            throw new Error('A data store instance is required for BudgetService.');
        }

        this.store = store;
    }

    upsertBudget(budget) {
        return this.store.upsertBudget(budget);
    }

    getBudgetReport({ referenceDate = dayjs(), period = 'monthly' } = {}) {
        const reference = dayjs(referenceDate);

        if (!reference.isValid()) {
            throw new Error('Reference date for budget report is invalid.');
        }

        const { from, to } = this.#resolveWindow(reference, period);
        const transactions = this.store.getTransactions({ from: from.format('YYYY-MM-DD'), to: to.format('YYYY-MM-DD') });

        const totalsByCategory = transactions.reduce((accumulator, transaction) => {
            const positiveAmount = Math.max(Number(transaction.amount) || 0, 0);
            if (!accumulator[transaction.category]) {
                accumulator[transaction.category] = 0;
            }
            accumulator[transaction.category] += positiveAmount;
            return accumulator;
        }, {});

        const budgets = this.store.getBudgets();
        const entries = budgets.map((budget) => {
            const spent = Number((totalsByCategory[budget.category] || 0).toFixed(2));
            const variance = Number((budget.amount - spent).toFixed(2));
            const percentageUsed = budget.amount > 0 ? Number(((spent / budget.amount) * 100).toFixed(2)) : null;
            const status = variance >= 0 ? 'under' : 'over';

            return {
                ...budget,
                spent,
                variance,
                percentageUsed,
                status
            };
        });

        Object.entries(totalsByCategory).forEach(([category, spentValue]) => {
            const alreadyTracked = budgets.some((budget) => budget.category === category);
            if (!alreadyTracked) {
                const spent = Number(spentValue.toFixed(2));
                entries.push({
                    category,
                    amount: 0,
                    period,
                    description: 'Unbudgeted category',
                    spent,
                    variance: -spent,
                    percentageUsed: null,
                    status: 'over'
                });
            }
        });

        const totals = entries.reduce((accumulator, entry) => {
            accumulator.budgeted += entry.amount;
            accumulator.spent += entry.spent;
            return accumulator;
        }, { budgeted: 0, spent: 0 });

        totals.budgeted = Number(totals.budgeted.toFixed(2));
        totals.spent = Number(totals.spent.toFixed(2));

        return {
            period,
            referenceDate: reference.format('YYYY-MM-DD'),
            window: {
                from: from.format('YYYY-MM-DD'),
                to: to.format('YYYY-MM-DD')
            },
            entries,
            totals,
            categoriesOverBudget: entries
                .filter((entry) => entry.status === 'over')
                .map((entry) => entry.category)
        };
    }

    #resolveWindow(reference, period) {
        switch (period) {
        case 'weekly': {
            const start = reference.subtract(reference.day(), 'day');
            return {
                from: start,
                to: start.add(6, 'day')
            };
        }
        case 'quarterly': {
            const quarterIndex = Math.floor(reference.month() / 3);
            const start = reference.set('month', quarterIndex * 3).startOf('month');
            const end = start.add(2, 'month').endOf('month');
            return { from: start, to: end };
        }
        case 'monthly':
        default: {
            const start = reference.startOf('month');
            const end = reference.endOf('month');
            return { from: start, to: end };
        }
        }
    }
}

module.exports = BudgetService;
