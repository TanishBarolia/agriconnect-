// Simple, transparent rule-based crop suggestion engine.
//
// This is NOT a machine learning model — it's an explainable rule table
// matching temperature/humidity/season bands to commonly-grown Indian crops.
// Good enough for guidance; real agronomic decisions should also factor in
// soil type, irrigation access, and local agricultural extension advice.

function getSeason(date = new Date()) {
    const month = date.getMonth() + 1; // 1-12
    // Indian agricultural seasons (approximate)
    if (month >= 6 && month <= 10) return 'Kharif';     // monsoon-sown, June-Oct
    if (month >= 11 || month <= 3) return 'Rabi';        // winter-sown, Nov-Mar
    return 'Zaid';                                        // summer, Mar-June
}

const CROP_RULES = [
    {
        season: 'Kharif',
        condition: (w) => w.tempC >= 25 && w.humidity >= 60,
        crops: ['Rice (Paddy)', 'Cotton', 'Soyabean', 'Maize'],
        reason: 'Warm, humid conditions with monsoon rainfall favor these Kharif crops.'
    },
    {
        season: 'Kharif',
        condition: (w) => w.tempC >= 25 && w.humidity < 60,
        crops: ['Groundnut', 'Pulses (Tur/Moong)', 'Bajra (Pearl Millet)'],
        reason: 'Warm but drier conditions suit hardier, drought-tolerant Kharif crops.'
    },
    {
        season: 'Kharif',
        condition: (w) => w.tempC < 25,
        crops: ['Ragi (Finger Millet)', 'Hill Pulses'],
        reason: 'Cooler-than-typical Kharif conditions (likely a hill region or unseasonal spell) suit hardy millets over standard monsoon staples.'
    },
    {
        season: 'Rabi',
        condition: (w) => w.tempC <= 25,
        crops: ['Wheat', 'Mustard', 'Chickpea (Gram)', 'Barley'],
        reason: 'Cool winter temperatures are ideal for these Rabi crops.'
    },
    {
        season: 'Rabi',
        condition: (w) => w.tempC > 25,
        crops: ['Potato', 'Peas', 'Coriander'],
        reason: 'Mild Rabi-season warmth still works for these short-cycle crops.'
    },
    {
        season: 'Zaid',
        condition: (w) => w.tempC >= 30,
        crops: ['Watermelon', 'Muskmelon', 'Cucumber', 'Fodder crops'],
        reason: 'High summer heat favors fast-growing, heat-tolerant Zaid crops.'
    },
    {
        season: 'Zaid',
        condition: () => true,
        crops: ['Moong (Summer pulse)', 'Vegetables with irrigation'],
        reason: 'Moderate summer conditions support short-duration irrigated crops.'
    }
];

/**
 * Suggest crops based on current weather and season.
 * @param {{tempC:number, humidity:number}} weather
 * @returns {{season:string, suggestions:Array<{crops:string[], reason:string}>}}
 */
function suggestCrops(weather) {
    const season = getSeason();
    const matches = CROP_RULES.filter(r => r.season === season && r.condition(weather));
    const fallback = CROP_RULES.find(r => r.season === season);
    const chosen = matches.length > 0 ? matches : [fallback];

    return {
        season,
        suggestions: chosen.map(r => ({ crops: r.crops, reason: r.reason }))
    };
}

module.exports = { suggestCrops, getSeason, CROP_RULES };
