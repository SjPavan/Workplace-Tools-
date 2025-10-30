const { applyRuleBasedCategory } = require('../utils/categorizationRules');
const { parseTransactionsCsv } = require('../utils/csvParser');

class TransactionService {
    constructor(store, { categorise = applyRuleBasedCategory } = {}) {
        if (!store) {
            throw new Error('A data store instance is required for TransactionService.');
        }

        this.store = store;
        this.categorise = categorise;
    }

    importCsv(csvContent, options = {}) {
        const { records, errors } = parseTransactionsCsv(csvContent, options);
        const imported = records.map((record) => {
            const transaction = { ...record };
            transaction.category = this.categorise(transaction, { defaultCategory: 'Miscellaneous' });
            return this.store.addTransaction(transaction);
        });

        return {
            imported,
            importedCount: imported.length,
            failedCount: errors.length,
            errors
        };
    }

    addManualTransaction(transaction) {
        if (!transaction) {
            throw new Error('Transaction payload is required.');
        }

        const enriched = { ...transaction };
        enriched.category = this.categorise(enriched, { defaultCategory: 'Miscellaneous' });

        return this.store.addTransaction(enriched);
    }

    listTransactions(filters = {}) {
        return this.store.getTransactions(filters);
    }
}

module.exports = TransactionService;
