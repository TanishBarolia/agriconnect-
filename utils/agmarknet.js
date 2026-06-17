// Agmarknet (data.gov.in) integration.
//
// Resource: "Current Daily Price of Various Commodities from Various Markets (Mandi)"
// Docs: https://www.data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi
//
// We cache responses for 30 minutes per (state, commodity) combo. The
// underlying mandi data only updates once a day, so this avoids unnecessary
// calls and keeps us comfortably inside any rate limit data.gov.in applies.

const axios = require('axios');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 30 * 60 }); // 30 minutes

const BASE_URL = 'https://api.data.gov.in/resource';

function buildCacheKey(params) {
    return JSON.stringify(params);
}

/**
 * Fetch live mandi prices.
 * @param {Object} opts
 * @param {string} [opts.state] - e.g. "Karnataka"
 * @param {string} [opts.commodity] - e.g. "Tomato"
 * @param {string} [opts.market] - e.g. "Bangalore"
 * @param {number} [opts.limit]
 * @returns {Promise<{records: Array, source: 'live'|'cache'|'error', error?: string}>}
 */
async function getMandiPrices({ state, commodity, market, limit = 50 } = {}) {
    const apiKey = process.env.DATA_GOV_IN_API_KEY;
    const resourceId = process.env.AGMARKNET_RESOURCE_ID;

    if (!apiKey || apiKey === 'your_data_gov_in_key_here') {
        return {
            records: [],
            source: 'error',
            error: 'DATA_GOV_IN_API_KEY is not configured. Add it to your .env file.'
        };
    }

    const params = { state, commodity, market, limit };
    const cacheKey = buildCacheKey(params);
    const cached = cache.get(cacheKey);
    if (cached) {
        return { records: cached, source: 'cache' };
    }

    try {
        const query = {
            'api-key': apiKey,
            format: 'json',
            limit
        };
        // data.gov.in uses filters[fieldname]=value query params
        if (state) query['filters[state]'] = state;
        if (commodity) query['filters[commodity]'] = commodity;
        if (market) query['filters[market]'] = market;

        const response = await axios.get(`${BASE_URL}/${resourceId}`, {
            params: query,
            timeout: 8000
        });

        const records = response.data && response.data.records ? response.data.records : [];
        cache.set(cacheKey, records);
        return { records, source: 'live' };
    } catch (err) {
        const status = err.response ? err.response.status : null;
        let message = err.message;
        if (status === 401 || status === 403) {
            message = 'API key was rejected by data.gov.in. Double check DATA_GOV_IN_API_KEY in .env.';
        }
        return { records: [], source: 'error', error: message };
    }
}

/**
 * Returns a small static list of Indian states/commodities for filter dropdowns.
 * (Not from the API — just UI convenience constants.)
 */
const COMMON_STATES = [
    'Karnataka', 'Maharashtra', 'Punjab', 'Uttar Pradesh', 'Tamil Nadu',
    'Gujarat', 'Madhya Pradesh', 'Rajasthan', 'Andhra Pradesh', 'Telangana',
    'West Bengal', 'Bihar', 'Haryana'
];

const COMMON_COMMODITIES = [
    'Tomato', 'Onion', 'Potato', 'Wheat', 'Rice', 'Maize', 'Cotton',
    'Soyabean', 'Groundnut', 'Sugarcane', 'Chilli', 'Brinjal'
];

module.exports = { getMandiPrices, COMMON_STATES, COMMON_COMMODITIES };
