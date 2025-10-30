const CATEGORY_RULES = [
    {
        category: 'Housing',
        keywords: ['rent', 'mortgage', 'landlord', 'apartment', 'property management']
    },
    {
        category: 'Utilities',
        keywords: ['utility', 'electric', 'water', 'gas', 'internet', 'power', 'energy']
    },
    {
        category: 'Groceries',
        keywords: ['grocery', 'supermarket', 'market', 'whole foods', 'trader joe', 'aldi', 'kroger']
    },
    {
        category: 'Dining',
        keywords: ['restaurant', 'diner', 'cafe', 'coffee', 'bistro', 'eatery', 'bar']
    },
    {
        category: 'Transport',
        keywords: ['uber', 'lyft', 'taxi', 'transport', 'metro', 'bus', 'fuel', 'gas station', 'parking']
    },
    {
        category: 'Health',
        keywords: ['pharmacy', 'clinic', 'hospital', 'medical', 'dentist', 'vision', 'wellness']
    },
    {
        category: 'Entertainment',
        keywords: ['movie', 'netflix', 'spotify', 'entertainment', 'theatre', 'concert', 'gaming', 'subscription']
    },
    {
        category: 'Travel',
        keywords: ['airline', 'hotel', 'travel', 'airbnb', 'booking', 'expedia', 'trip']
    },
    {
        category: 'Education',
        keywords: ['education', 'books', 'tuition', 'course', 'udemy', 'coursera', 'learning']
    },
    {
        category: 'Investments',
        keywords: ['investment', 'brokerage', 'etrade', 'robinhood', 'fidelity', '401k', 'ira', 'etf', 'stock']
    },
    {
        category: 'Savings',
        keywords: ['savings', 'emergency fund', 'transfer to savings']
    },
    {
        category: 'Insurance',
        keywords: ['insurance', 'premium', 'insurer', 'policy']
    }
];

const normalizeText = (value) => (value || '').toString().trim().toLowerCase();

const buildSearchText = (...parts) => normalizeText(parts.filter(Boolean).join(' '));

function applyRuleBasedCategory(transaction, { defaultCategory = 'Miscellaneous', rules = CATEGORY_RULES } = {}) {
    if (!transaction) {
        throw new Error('Transaction is required for categorisation.');
    }

    if (transaction.category) {
        return transaction.category;
    }

    const amount = Number(transaction.amount);
    if (Number.isFinite(amount) && amount < 0) {
        return 'Income';
    }

    const searchableText = buildSearchText(transaction.description, transaction.merchant, transaction.account);

    if (!searchableText) {
        return defaultCategory;
    }

    for (const rule of rules) {
        if (rule.matcher && typeof rule.matcher === 'function') {
            if (rule.matcher(transaction, searchableText)) {
                return rule.category;
            }
        }

        if (Array.isArray(rule.keywords)) {
            const keywordMatch = rule.keywords.some((keyword) => searchableText.includes(normalizeText(keyword)));
            if (keywordMatch) {
                return rule.category;
            }
        }
    }

    return defaultCategory;
}

module.exports = {
    CATEGORY_RULES,
    applyRuleBasedCategory
};
