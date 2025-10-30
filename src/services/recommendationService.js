const buildRecommendations = ({ analyticsSummary, budgetReport, forecastResult, investmentInsights }) => {
    const recommendations = [];

    if (budgetReport && Array.isArray(budgetReport.entries)) {
        budgetReport.entries
            .filter((entry) => entry.status === 'over')
            .forEach((entry) => {
                recommendations.push({
                    type: 'budget',
                    category: entry.category,
                    priority: 'high',
                    message: `Spending in ${entry.category} exceeded the ${entry.period} budget by $${Math.abs(entry.variance).toFixed(2)}. Reduce discretionary spend or reallocate budget to stay on track.`,
                    suggestedAction: `Target a reduction of $${Math.min(entry.spent, Math.abs(entry.variance)).toFixed(2)} next period.`
                });
            });
    }

    if (analyticsSummary && Array.isArray(analyticsSummary.categoryBreakdown) && analyticsSummary.totalSpent > 0) {
        const [topCategory] = analyticsSummary.categoryBreakdown;
        if (topCategory) {
            const share = (topCategory.amount / analyticsSummary.totalSpent) * 100;
            if (share > 35) {
                recommendations.push({
                    type: 'spending-balance',
                    category: topCategory.category,
                    priority: 'medium',
                    message: `${topCategory.category} represents ${share.toFixed(1)}% of total spending. Consider spreading costs across the month or negotiating recurring bills.`,
                    suggestedAction: 'Break down large recurring costs into smaller scheduled payments where possible.'
                });
            }
        }
    }

    if (forecastResult && Array.isArray(forecastResult.forecast) && forecastResult.forecast.length) {
        const lastActual = forecastResult.baseSeries && forecastResult.baseSeries.length
            ? forecastResult.baseSeries[forecastResult.baseSeries.length - 1].total
            : 0;
        const nextForecast = forecastResult.forecast[0]?.projected ?? 0;

        if (nextForecast > lastActual && lastActual > 0) {
            const increase = ((nextForecast - lastActual) / lastActual) * 100;
            recommendations.push({
                type: 'forecast',
                priority: 'medium',
                message: `Projected expenses are trending up by approximately ${increase.toFixed(1)}% next month. Plan ahead by reserving funds or identifying savings now.`,
                suggestedAction: 'Review monthly subscriptions and upcoming large expenses to smooth cash flow.'
            });
        }

        if (forecastResult.model === 'linear-regression-fallback') {
            recommendations.push({
                type: 'forecast',
                priority: 'low',
                message: 'Advanced forecasting (Prophet) is unavailable. Install the Prophet dependency to unlock confidence intervals and seasonality-aware projections.',
                suggestedAction: 'Install Prophet (pip install prophet) and rerun the forecast endpoint with useProphet=true.'
            });
        }
    }

    if (investmentInsights) {
        (investmentInsights.insights || []).forEach((insight) => {
            recommendations.push({
                type: 'investments',
                priority: 'medium',
                message: insight,
                suggestedAction: 'Adjust automated transfers or rebalance allocation as needed.'
            });
        });

        if (investmentInsights.averageMonthlyContribution === 0) {
            recommendations.push({
                type: 'investments',
                priority: 'high',
                message: 'No automated contributions detected. Automating deposits ensures consistent progress towards investment goals.',
                suggestedAction: 'Schedule a recurring monthly transfer into your investment or savings account.'
            });
        }
    }

    if (!recommendations.length) {
        recommendations.push({
            type: 'general',
            priority: 'low',
            message: 'Finances look well balanced this period. Continue monitoring budgets and revisit goals quarterly.',
            suggestedAction: 'Set reminders to review budgets and forecasts at the start of each month.'
        });
    }

    return recommendations;
};

module.exports = {
    buildRecommendations
};
