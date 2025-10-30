const sampleTransactions = [
    { date: '2024-01-05', amount: 120.5, category: 'Groceries' },
    { date: '2024-01-22', amount: 80.1, category: 'Utilities' },
    { date: '2024-02-10', amount: 210.75, category: 'Groceries' },
    { date: '2024-02-22', amount: 95.32, category: 'Dining' },
    { date: '2024-03-08', amount: 134.11, category: 'Groceries' },
    { date: '2024-03-28', amount: 220.9, category: 'Travel' },
    { date: '2024-04-02', amount: 180.5, category: 'Groceries' }
];

describe('forecastService', () => {
    afterEach(() => {
        jest.resetModules();
        jest.dontMock('child_process');
    });

    it('computes a linear regression forecast by default', () => {
        const { forecastExpenses } = require('../src/services/forecastService');
        const result = forecastExpenses(sampleTransactions, { periods: 3 });

        expect(result.model).toBe('linear-regression');
        expect(result.baseSeries).toHaveLength(4);
        expect(result.forecast).toHaveLength(3);
        expect(result.forecast[0]).toHaveProperty('projected');
        expect(result.diagnostics).toHaveProperty('slope');
    });

    it('falls back to linear regression when Prophet is unavailable', () => {
        jest.doMock('child_process', () => ({
            spawnSync: jest.fn(() => ({ status: 1, stderr: 'Prophet dependencies unavailable' }))
        }));

        const { forecastExpenses } = require('../src/services/forecastService');
        const result = forecastExpenses(sampleTransactions, { periods: 2, useProphet: true });

        expect(result.model).toBe('linear-regression-fallback');
        expect(result.forecast).toHaveLength(2);
        expect(result.warnings[0]).toContain('Prophet');
    });
});
