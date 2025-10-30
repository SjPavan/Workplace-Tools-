const dayjs = require('dayjs');

class AnalyticsService {
    constructor(store, budgetService) {
        if (!store) {
            throw new Error('A data store instance is required for AnalyticsService.');
        }

        this.store = store;
        this.budgetService = budgetService;
    }

    getExpenseSummary({ from, to } = {}) {
        const transactions = this.store.getTransactions({ from, to });
        const totalSpent = transactions.reduce((accumulator, transaction) => accumulator + Math.max(transaction.amount, 0), 0);
        const averageTransaction = transactions.length ? Number((totalSpent / transactions.length).toFixed(2)) : 0;
        const categoryBreakdown = this.#aggregateByCategory(transactions);
        const monthlyTotals = this.#aggregateByMonth(transactions);
        const topMerchants = this.#topMerchants(transactions, 5);

        const summary = {
            transactionCount: transactions.length,
            totalSpent: Number(totalSpent.toFixed(2)),
            averageTransaction,
            categoryBreakdown,
            monthlyTotals,
            topMerchants
        };

        if (this.budgetService) {
            summary.budgetReport = this.budgetService.getBudgetReport();
        }

        return summary;
    }

    getDashboardTrends({ months = 6 } = {}) {
        const transactions = this.store.getTransactions();
        const monthlyTotals = this.#aggregateByMonth(transactions).sort((a, b) => (a.period > b.period ? 1 : -1));
        const recent = monthlyTotals.slice(-months);
        const change = this.#calculateTrendChange(recent);

        return {
            months: recent,
            totalMonths: monthlyTotals.length,
            change,
            direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat'
        };
    }

    #aggregateByCategory(transactions) {
        const totals = transactions.reduce((accumulator, transaction) => {
            const key = transaction.category || 'Uncategorised';
            if (!accumulator[key]) {
                accumulator[key] = 0;
            }
            accumulator[key] += Math.max(transaction.amount, 0);
            return accumulator;
        }, {});

        return Object.entries(totals)
            .map(([category, amount]) => ({ category, amount: Number(amount.toFixed(2)) }))
            .sort((a, b) => b.amount - a.amount);
    }

    #aggregateByMonth(transactions) {
        const totals = transactions.reduce((accumulator, transaction) => {
            const monthKey = dayjs(transaction.date).format('YYYY-MM');
            if (!accumulator[monthKey]) {
                accumulator[monthKey] = 0;
            }
            accumulator[monthKey] += Math.max(transaction.amount, 0);
            return accumulator;
        }, {});

        return Object.entries(totals)
            .map(([period, total]) => ({
                period,
                total: Number(total.toFixed(2))
            }))
            .sort((a, b) => (a.period > b.period ? 1 : -1));
    }

    #topMerchants(transactions, limit) {
        const totals = transactions.reduce((accumulator, transaction) => {
            const merchant = transaction.merchant && transaction.merchant.trim() ? transaction.merchant.trim() : 'Unspecified';
            if (!accumulator[merchant]) {
                accumulator[merchant] = 0;
            }
            accumulator[merchant] += Math.max(transaction.amount, 0);
            return accumulator;
        }, {});

        return Object.entries(totals)
            .map(([merchant, amount]) => ({ merchant, amount: Number(amount.toFixed(2)) }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, limit);
    }

    #calculateTrendChange(series) {
        if (!series.length || series.length < 2) {
            return 0;
        }

        const first = series[0].total;
        const last = series[series.length - 1].total;

        if (first === 0) {
            return last === 0 ? 0 : 100;
        }

        return Number((((last - first) / first) * 100).toFixed(2));
    }
}

module.exports = AnalyticsService;
