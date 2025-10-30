const express = require('express');
const dayjs = require('dayjs');

const { createDefaultStore } = require('./dataStore');
const TransactionService = require('./services/transactionService');
const BudgetService = require('./services/budgetService');
const AnalyticsService = require('./services/analyticsService');
const InvestmentService = require('./services/investmentService');
const { forecastExpenses } = require('./services/forecastService');
const { buildRecommendations } = require('./services/recommendationService');

const createApp = (store = createDefaultStore()) => {
    const app = express();

    const transactionService = new TransactionService(store);
    const budgetService = new BudgetService(store);
    const analyticsService = new AnalyticsService(store, budgetService);
    const investmentService = new InvestmentService(store);

    app.use(express.json({ limit: '5mb' }));
    app.use(express.text({ type: 'text/csv', limit: '5mb' }));

    app.get('/api/health', (request, response) => {
        response.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    app.get('/api/transactions', (request, response) => {
        const { category, from, to } = request.query;
        const filters = {};
        if (category) {
            filters.category = category;
        }
        if (from) {
            filters.from = from;
        }
        if (to) {
            filters.to = to;
        }
        const transactions = transactionService.listTransactions(filters);
        response.json({ transactions, count: transactions.length });
    });

    app.post('/api/transactions', (request, response, next) => {
        try {
            const transaction = transactionService.addManualTransaction(request.body);
            response.status(201).json({ transaction });
        } catch (error) {
            next(error);
        }
    });

    app.post('/api/import/csv', (request, response, next) => {
        try {
            const csvContent = typeof request.body === 'string' ? request.body : request.body?.csv;
            if (!csvContent || typeof csvContent !== 'string') {
                return response.status(400).json({ error: 'CSV payload is required.' });
            }

            const options = typeof request.body === 'object' && !(request.body instanceof String) ? request.body.options || {} : {};
            const result = transactionService.importCsv(csvContent, options);
            return response.json(result);
        } catch (error) {
            return next(error);
        }
    });

    app.post('/api/budgets', (request, response, next) => {
        try {
            const record = budgetService.upsertBudget(request.body);
            response.status(201).json({ budget: record });
        } catch (error) {
            next(error);
        }
    });

    app.get('/api/budgets', (request, response) => {
        const budgets = store.getBudgets();
        response.json({ budgets });
    });

    app.get('/api/analytics/summary', (request, response) => {
        const { from, to } = request.query;
        const summary = analyticsService.getExpenseSummary({ from, to });
        response.json(summary);
    });

    app.get('/api/analytics/trends', (request, response) => {
        const months = Number(request.query.months) || 6;
        const trends = analyticsService.getDashboardTrends({ months });
        response.json(trends);
    });

    app.get('/api/forecast', (request, response) => {
        const periods = Number(request.query.periods) || 6;
        const useProphet = request.query.useProphet === 'true' || request.query.useProphet === true;
        const transactions = store.getTransactions();
        const forecast = forecastExpenses(transactions, { periods, useProphet });
        response.json(forecast);
    });

    app.get('/api/investments/insights', (request, response) => {
        const lookbackMonths = Number(request.query.lookbackMonths) || 12;
        const insights = investmentService.getInsights({ lookbackMonths });
        response.json(insights);
    });

    app.get('/api/recommendations', (request, response) => {
        const useProphet = request.query.useProphet === 'true' || request.query.useProphet === true;
        const analyticsSummary = analyticsService.getExpenseSummary();
        const budgetReport = analyticsSummary.budgetReport || null;
        const forecastResult = forecastExpenses(store.getTransactions(), { useProphet, periods: 3 });
        const investmentInsights = investmentService.getInsights({ lookbackMonths: 6 });
        const recommendations = buildRecommendations({ analyticsSummary, budgetReport, forecastResult, investmentInsights });

        response.json({
            generatedAt: dayjs().toISOString(),
            recommendations,
            context: {
                forecastModel: forecastResult.model,
                totalTransactions: analyticsSummary.transactionCount
            }
        });
    });

    // Generic error handler
    // eslint-disable-next-line no-unused-vars
    app.use((error, request, response, _next) => {
        const statusCode = error.statusCode || 400;
        response.status(statusCode).json({ error: error.message || 'Unexpected error encountered.' });
    });

    return app;
};

const app = createApp();

if (require.main === module) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        // eslint-disable-next-line no-console
        console.log(`Financial analytics service listening on port ${port}`);
    });
}

module.exports = {
    app,
    createApp
};
