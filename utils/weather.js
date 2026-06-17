// OpenWeatherMap "Current Weather Data" integration (the free, no-card endpoint —
// NOT One Call 3.0, which requires billing details on file).
// Docs: https://openweathermap.org/current

const axios = require('axios');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 15 * 60 }); // 15 minutes — weather changes slowly

const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

/**
 * Fetch current weather for a city name (e.g. "Bengaluru,IN").
 * @param {string} cityName
 * @returns {Promise<{ok: boolean, data?: object, error?: string}>}
 */
async function getCurrentWeather(cityName) {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey || apiKey === 'your_openweathermap_key_here') {
        return { ok: false, error: 'OPENWEATHER_API_KEY is not configured. Add it to your .env file.' };
    }
    if (!cityName) {
        return { ok: false, error: 'No city provided.' };
    }

    const cacheKey = cityName.toLowerCase();
    const cached = cache.get(cacheKey);
    if (cached) {
        return { ok: true, data: cached, source: 'cache' };
    }

    try {
        const response = await axios.get(BASE_URL, {
            params: { q: cityName, appid: apiKey, units: 'metric' },
            timeout: 8000
        });

        const d = response.data;
        const simplified = {
            city: d.name,
            country: d.sys && d.sys.country,
            tempC: Math.round(d.main.temp),
            feelsLikeC: Math.round(d.main.feels_like),
            humidity: d.main.humidity,
            condition: d.weather && d.weather[0] ? d.weather[0].main : 'Unknown',
            description: d.weather && d.weather[0] ? d.weather[0].description : '',
            windSpeed: d.wind ? d.wind.speed : null,
            icon: d.weather && d.weather[0] ? d.weather[0].icon : null
        };
        cache.set(cacheKey, simplified);
        return { ok: true, data: simplified, source: 'live' };
    } catch (err) {
        const status = err.response ? err.response.status : null;
        let message = err.message;
        if (status === 401) {
            message = 'Weather API key was rejected. New OpenWeatherMap keys can take up to 2 hours to activate — if you just signed up, wait and retry.';
        } else if (status === 404) {
            message = `City "${cityName}" not found. Try "City,IN" format, e.g. "Mysuru,IN".`;
        }
        return { ok: false, error: message };
    }
}

module.exports = { getCurrentWeather };
