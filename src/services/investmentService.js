const dayjs = require('dayjs');

class InvestmentService {
    constructor(store) {
        if (!store) {
            throw new Error('A data store instance is required for InvestmentService.');
        }

        this.store = store;
    }

    getInsights({ lookbackMonths = 12 } = {}) {
        const transactions = this.store.getTransactions();
        const relevantTransactions = transactions.filter((transaction) => ['Investments', 'Savings'].includes(transaction.category));

        const contributionsByMonth = this.#aggregateByMonth(relevantTransactions).sort((a, b) => (a.period > b.period ? 1 : -1));
        const recentMonths = contributionsByMonth.slice(-lookbackMonths);

        const totalContribution = recentMonths.reduce((accumulator, entry) => accumulator + entry.total, 0);
        const averageMonthlyContribution = recentMonths.length ? Number((totalContribution / recentMonths.length).toFixed(2)) : 0;
        const latest = recentMonths[recentMonths.length - 1] || null;
        const streak = this.#calculateContributionStreak(contributionsByMonth);
        const growthRate = this.#calculateGrowthRate(recentMonths);

        const insights = [];

        if (!recentMonths.length) {
            insights.push('No investment or savings contributions recorded in the selected period. Consider scheduling recurring transfers to build momentum.');
        } else {
            if (growthRate < 0) {
                insights.push('Investment contributions have decreased recently. Review your cash flow and ensure goals remain funded.');
            } else if (growthRate > 0) {
                insights.push('Great job increasing your investment contributions. Maintain the positive momentum to accelerate goal progress.');
            }

            if (latest && latest.total < averageMonthlyContribution) {
                insights.push('Your most recent contribution is below your average. Setting up automated transfers can help maintain consistency.');
            }

            if (averageMonthlyContribution > 0 && averageMonthlyContribution < 200) {
                insights.push('Average monthly contributions are modest. Increasing deposits by even 5-10% could noticeably boost long-term returns.');
            }

            if (streak >= 6) {
                insights.push(`You have contributed for ${streak} consecutive months. Consider reviewing investment allocation to ensure it still aligns with your goals.`);
            }
        }

        return {
            totalContribution: Number(totalContribution.toFixed(2)),
            averageMonthlyContribution,
            contributionTrend: recentMonths,
            latestContribution: latest,
            consecutiveMonthStreak: streak,
            growthRate,
            insights
        };
    }

    #aggregateByMonth(transactions) {
        const totals = transactions.reduce((accumulator, transaction) => {
            const period = dayjs(transaction.date).format('YYYY-MM');
            if (!accumulator[period]) {
                accumulator[period] = 0;
            }
            accumulator[period] += Math.max(transaction.amount, 0);
            return accumulator;
        }, {});

        return Object.entries(totals).map(([period, total]) => ({ period, total: Number(total.toFixed(2)) }));
    }

    #calculateContributionStreak(series) {
        let streak = 0;

        for (let index = series.length - 1; index >= 0; index -= 1) {
            if (series[index].total > 0) {
                streak += 1;
            } else {
                break;
            }
        }

        return streak;
    }

    #calculateGrowthRate(series) {
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

module.exports = InvestmentService;
