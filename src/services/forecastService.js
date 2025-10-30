const dayjs = require('dayjs');
const path = require('path');
const { spawnSync } = require('child_process');

class ProphetUnavailableError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ProphetUnavailableError';
    }
}

const buildMonthlySeries = (transactions) => {
    const aggregated = transactions.reduce((accumulator, transaction) => {
        const period = dayjs(transaction.date).format('YYYY-MM');
        if (!accumulator[period]) {
            accumulator[period] = {
                period,
                total: 0,
                count: 0
            };
        }
        accumulator[period].total += Math.max(transaction.amount, 0);
        accumulator[period].count += 1;
        return accumulator;
    }, {});

    return Object.values(aggregated)
        .map((entry) => ({
            period: entry.period,
            total: Number(entry.total.toFixed(2)),
            count: entry.count,
            average: Number((entry.total / entry.count).toFixed(2))
        }))
        .sort((a, b) => (a.period > b.period ? 1 : -1));
};

const linearRegressionForecast = (series, periods) => {
    if (!series.length) {
        return { forecast: [], diagnostics: { slope: 0, intercept: 0, standardDeviation: 0 } };
    }

    const xs = series.map((_, index) => index + 1);
    const ys = series.map((point) => point.total);
    const n = xs.length;

    const sumX = xs.reduce((accumulator, value) => accumulator + value, 0);
    const sumY = ys.reduce((accumulator, value) => accumulator + value, 0);
    const sumXY = xs.reduce((accumulator, value, index) => accumulator + (value * ys[index]), 0);
    const sumX2 = xs.reduce((accumulator, value) => accumulator + (value * value), 0);

    const denominator = (n * sumX2) - (sumX ** 2);
    let slope = 0;
    let intercept = 0;

    if (denominator !== 0) {
        slope = ((n * sumXY) - (sumX * sumY)) / denominator;
        intercept = (sumY - (slope * sumX)) / n;
    } else {
        intercept = ys[0] || 0;
    }

    const baseDate = dayjs(`${series[series.length - 1].period}-01`);

    const forecast = Array.from({ length: periods }, (_, iterationIndex) => {
        const x = n + iterationIndex + 1;
        const projected = Math.max((slope * x) + intercept, 0);
        const period = baseDate.add(iterationIndex + 1, 'month').format('YYYY-MM');
        return {
            period,
            projected: Number(projected.toFixed(2))
        };
    });

    const residuals = ys.map((y, index) => {
        const expected = (slope * xs[index]) + intercept;
        return y - expected;
    });

    const residualMean = residuals.reduce((accumulator, value) => accumulator + value, 0) / residuals.length || 0;
    const variance = residuals.reduce((accumulator, value) => accumulator + ((value - residualMean) ** 2), 0) / (residuals.length || 1);
    const standardDeviation = Math.sqrt(Math.max(variance, 0));

    return {
        forecast,
        diagnostics: {
            slope: Number(slope.toFixed(6)),
            intercept: Number(intercept.toFixed(2)),
            standardDeviation: Number(standardDeviation.toFixed(2))
        }
    };
};

const runProphetForecast = (series, periods) => {
    const scriptPath = path.join(__dirname, 'prophet_forecast.py');
    const payload = JSON.stringify({ series, periods });

    const result = spawnSync('python3', [scriptPath], {
        input: payload,
        encoding: 'utf-8',
        timeout: 15000
    });

    if (result.error) {
        throw new ProphetUnavailableError(result.error.message);
    }

    if (result.status !== 0) {
        const stderr = (result.stderr || '').trim();
        const stdout = (result.stdout || '').trim();
        throw new ProphetUnavailableError(stderr || stdout || 'Prophet process exited with a non-zero status.');
    }

    const output = (result.stdout || '').trim();

    if (!output) {
        throw new ProphetUnavailableError('Prophet process returned empty output.');
    }

    try {
        return JSON.parse(output);
    } catch (error) {
        throw new ProphetUnavailableError(`Unable to parse Prophet response: ${error.message}`);
    }
};

const forecastExpenses = (transactions, options = {}) => {
    const { periods = 6, useProphet = false } = options;
    const baseSeries = buildMonthlySeries(transactions);

    if (!baseSeries.length) {
        return {
            baseSeries,
            forecast: [],
            model: 'insufficient-data'
        };
    }

    if (useProphet) {
        try {
            const prophetForecast = runProphetForecast(baseSeries, periods);
            return {
                baseSeries,
                forecast: prophetForecast,
                model: 'prophet'
            };
        } catch (error) {
            const { forecast, diagnostics } = linearRegressionForecast(baseSeries, periods);
            return {
                baseSeries,
                forecast,
                model: 'linear-regression-fallback',
                diagnostics,
                warnings: [error.message]
            };
        }
    }

    const { forecast, diagnostics } = linearRegressionForecast(baseSeries, periods);

    return {
        baseSeries,
        forecast,
        model: 'linear-regression',
        diagnostics
    };
};

module.exports = {
    ProphetUnavailableError,
    buildMonthlySeries,
    linearRegressionForecast,
    forecastExpenses
};
