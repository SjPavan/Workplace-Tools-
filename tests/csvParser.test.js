const { parseTransactionsCsv } = require('../src/utils/csvParser');

describe('parseTransactionsCsv', () => {
    it('parses CSV content and normalises transaction fields', () => {
        const csv = `date,description,amount,merchant,account,tags
2024-01-01,Grocery Store,$120.45,Whole Foods,Checking,food;essential
2024-01-05,Rent Payment,(1500.00),Landlord,Checking,\n`;

        const { records, errors } = parseTransactionsCsv(csv);

        expect(errors).toHaveLength(0);
        expect(records).toHaveLength(2);

        expect(records[0]).toEqual({
            date: '2024-01-01',
            description: 'Grocery Store',
            amount: 120.45,
            category: undefined,
            merchant: 'Whole Foods',
            account: 'Checking',
            tags: ['food', 'essential'],
            metadata: {},
            sourceRow: 2
        });

        expect(records[1]).toMatchObject({
            date: '2024-01-05',
            description: 'Rent Payment',
            amount: -1500,
            merchant: 'Landlord',
            account: 'Checking',
            tags: []
        });
    });

    it('returns descriptive errors for invalid rows', () => {
        const csv = `date,description,amount
2024-02-01,,100
,Utilities,89.20\n`;

        const { records, errors } = parseTransactionsCsv(csv);

        expect(records).toHaveLength(0);
        expect(errors).toHaveLength(2);
        expect(errors[0]).toMatchObject({ type: 'missing_description' });
        expect(errors[1]).toMatchObject({ type: 'missing_date' });
    });
});
