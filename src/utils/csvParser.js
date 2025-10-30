const { parse } = require('csv-parse/sync');
const dayjs = require('dayjs');

const HEADER_ALIASES = {
    date: ['date', 'transaction date', 'transaction_date', 'posted date', 'posted_date', 'posted_at'],
    description: ['description', 'details', 'memo', 'narrative', 'note'],
    amount: ['amount', 'transaction amount', 'value', 'amt'],
    debit: ['debit'],
    credit: ['credit'],
    category: ['category', 'type', 'classification', 'class'],
    merchant: ['merchant', 'vendor', 'payee', 'counterparty', 'merchant name'],
    account: ['account', 'account name', 'account_number', 'account no', 'card'],
    tags: ['tags', 'labels']
};

const REQUIRED_FIELDS = ['date', 'amount', 'description'];

const toKey = (key) => key.toLowerCase().trim();

const sanitiseCurrency = (value) => {
    if (value === undefined || value === null) {
        return Number.NaN;
    }

    if (typeof value === 'number') {
        return Number(value);
    }

    const cleaned = value
        .toString()
        .trim()
        .replace(/[$,]/g, '')
        .replace(/\((.*)\)/, '-$1')
        .replace(/\s+/g, '');

    if (cleaned === '') {
        return Number.NaN;
    }

    const numeric = Number(cleaned);

    return Number.isFinite(numeric) ? numeric : Number.NaN;
};

const buildMetadata = (row, consumedKeys) => {
    const metadata = {};

    Object.entries(row).forEach(([key, value]) => {
        if (!consumedKeys.has(key) && value !== undefined && value !== null && `${value}`.trim() !== '') {
            metadata[key] = value;
        }
    });

    return metadata;
};

const normaliseRow = (row, rowNumber) => {
    const issues = [];
    const normalizedRow = {};

    Object.entries(row).forEach(([key, value]) => {
        const normalisedKey = toKey(key);
        if (!(normalisedKey in normalizedRow)) {
            if (typeof value === 'string') {
                normalizedRow[normalisedKey] = value.trim();
            } else {
                normalizedRow[normalisedKey] = value;
            }
        }
    });

    const consumedKeys = new Set();

    const fetchValue = (aliasKey) => {
        const aliases = HEADER_ALIASES[aliasKey] || [];
        for (const alias of aliases) {
            const normalizedAlias = toKey(alias);
            if (Object.prototype.hasOwnProperty.call(normalizedRow, normalizedAlias)) {
                const candidate = normalizedRow[normalizedAlias];
                if (candidate !== undefined && candidate !== null && `${candidate}`.trim() !== '') {
                    consumedKeys.add(normalizedAlias);
                    return candidate;
                }
            }
        }
        return undefined;
    };

    const rawDate = fetchValue('date');
    let date;

    if (rawDate) {
        const parsedDate = dayjs(rawDate);
        if (parsedDate.isValid()) {
            date = parsedDate.format('YYYY-MM-DD');
        } else {
            issues.push({ type: 'invalid_date', message: `Row ${rowNumber}: unable to parse date "${rawDate}".` });
        }
    } else {
        issues.push({ type: 'missing_date', message: `Row ${rowNumber}: date column is required.` });
    }

    const rawDescription = fetchValue('description');
    const description = rawDescription ? rawDescription.toString().trim() : '';
    if (!description) {
        issues.push({ type: 'missing_description', message: `Row ${rowNumber}: description column is required.` });
    }

    const rawCategory = fetchValue('category');
    const category = rawCategory ? rawCategory.toString().trim() : undefined;
    const rawMerchant = fetchValue('merchant');
    const merchant = rawMerchant ? rawMerchant.toString().trim() : undefined;
    const rawAccount = fetchValue('account');
    const account = rawAccount ? rawAccount.toString().trim() : undefined;
    const rawTags = fetchValue('tags');
    const tags = rawTags && typeof rawTags === 'string'
        ? rawTags.split(/[;,]/).map((tag) => tag.trim()).filter(Boolean)
        : [];

    let amount = sanitiseCurrency(fetchValue('amount'));

    if (!Number.isFinite(amount)) {
        const debit = sanitiseCurrency(fetchValue('debit'));
        const credit = sanitiseCurrency(fetchValue('credit'));

        if (Number.isFinite(debit) && debit !== 0) {
            amount = debit;
        } else if (Number.isFinite(credit) && credit !== 0) {
            amount = -credit;
        }
    }

    if (!Number.isFinite(amount)) {
        issues.push({ type: 'invalid_amount', message: `Row ${rowNumber}: amount column is required and must be numeric.` });
    }

    const missingRequired = REQUIRED_FIELDS.filter((field) => {
        switch (field) {
        case 'date':
            return !date;
        case 'amount':
            return !Number.isFinite(amount);
        case 'description':
            return !description;
        default:
            return false;
        }
    });

    if (missingRequired.length > 0) {
        return { transaction: null, issues };
    }

    const metadata = buildMetadata(normalizedRow, consumedKeys);

    const transaction = {
        date,
        description,
        amount: Number(amount.toFixed(2)),
        category,
        merchant,
        account,
        tags,
        metadata,
        sourceRow: rowNumber
    };

    return { transaction, issues };
};

function parseTransactionsCsv(csvString, options = {}) {
    if (typeof csvString !== 'string') {
        throw new Error('CSV content must be provided as a string.');
    }

    const trimmed = csvString.trim();

    if (!trimmed) {
        return { records: [], errors: [{ type: 'empty', message: 'CSV content is empty.' }] };
    }

    let rawRows;

    try {
        rawRows = parse(trimmed, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            ...options.parserOptions
        });
    } catch (error) {
        throw new Error(`Unable to parse CSV: ${error.message}`);
    }

    const records = [];
    const errors = [];

    rawRows.forEach((row, index) => {
        const rowNumber = index + 2; // account for header row
        const { transaction, issues } = normaliseRow(row, rowNumber);

        if (transaction) {
            records.push(transaction);
        }

        if (issues.length) {
            issues.forEach((issue) => errors.push({ row: rowNumber, ...issue }));
        }
    });

    return { records, errors };
}

module.exports = {
    parseTransactionsCsv
};
