const express = require('express');
const router = express.Router();
const { updateUser } = require('../utils/userStore');
const { getCurrentWeather } = require('../utils/weather');
const { suggestCrops } = require('../utils/cropAdvisor');
const { getMandiPrices, COMMON_STATES, COMMON_COMMODITIES } = require('../utils/agmarknet');

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/');
}

// Ensures the logged-in user's role matches the dashboard they're requesting.
// Prevents a farmer from loading /dashboard/seller by editing the URL.
function requireRole(role) {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.redirect(req.user && req.user.role ? `/dashboard/${req.user.role}` : '/');
        }
        next();
    };
}

router.get('/dashboard/farmer', isAuthenticated, requireRole('farmer'), async (req, res) => {
    const cityName = req.query.city || (req.user.location && req.user.location.name) || 'Bengaluru,IN';

    const [weatherResult, mandiResult] = await Promise.all([
        getCurrentWeather(cityName),
        getMandiPrices({ state: req.query.state, commodity: req.query.commodity, limit: 20 })
    ]);

    let cropAdvice = null;
    if (weatherResult.ok) {
        cropAdvice = suggestCrops(weatherResult.data);
        updateUser(req.user.id, { location: { name: cityName } });
    }

    res.render('dashboards/farmer', {
        user: req.user,
        weather: weatherResult,
        cropAdvice,
        mandi: mandiResult,
        states: COMMON_STATES,
        commodities: COMMON_COMMODITIES,
        selectedCity: cityName,
        selectedState: req.query.state || '',
        selectedCommodity: req.query.commodity || ''
    });
});

router.get('/dashboard/seller', isAuthenticated, requireRole('seller'), async (req, res) => {
    const mandiResult = await getMandiPrices({ state: req.query.state, commodity: req.query.commodity, limit: 20 });

    // Demo inventory — no DB, so this resets on restart and is illustrative only.
    const inventory = [
        { id: 'EQ-1001', name: 'Mahindra Tractor (Rental/Day)', category: 'Equipment', price: 1200, stock: 4, status: 'Active' },
        { id: 'SD-2045', name: 'High Yield Tomato Seeds (10g)', category: 'Seeds', price: 349, stock: 8, status: 'Active' },
        { id: 'FT-3092', name: 'Organic NPK Fertilizer (50kg)', category: 'Fertilizer', price: 1450, stock: 2, status: 'Low Stock' },
        { id: 'EQ-1102', name: 'Power Tiller', category: 'Equipment', price: 850, stock: 0, status: 'Out of Stock' }
    ];

    res.render('dashboards/seller', {
        user: req.user,
        storeName: req.user.storeName || req.user.name + "'s Store",
        metrics: {
            revenueThisMonth: '₹48,200',
            pendingOrders: 6,
            totalProducts: inventory.length,
            lowStockAlerts: inventory.filter(i => i.status === 'Low Stock').length
        },
        inventory,
        mandi: mandiResult,
        states: COMMON_STATES,
        commodities: COMMON_COMMODITIES,
        selectedState: req.query.state || '',
        selectedCommodity: req.query.commodity || ''
    });
});

router.get('/dashboard/worker', isAuthenticated, requireRole('worker'), async (req, res) => {
    // Demo job listings — illustrative since there's no DB / posting flow yet.
    const jobs = [
        { id: 'JOB-501', title: 'Harvest Labor Needed (Tomato Farm)', location: 'Mandya, Karnataka', wage: '₹600/day', duration: '5 days', postedBy: 'Ramesh Farms' },
        { id: 'JOB-502', title: 'Tractor Operator Required', location: 'Mysuru, Karnataka', wage: '₹900/day', duration: '2 days', postedBy: 'Green Valley Agro' },
        { id: 'JOB-503', title: 'Seasonal Pickers for Grape Vineyard', location: 'Nashik, Maharashtra', wage: '₹550/day', duration: '10 days', postedBy: 'Sahyadri Vineyards' }
    ];

    res.render('dashboards/worker', {
        user: req.user,
        jobs,
        skills: req.user.skills || []
    });
});

router.get('/dashboard/wholesaler', isAuthenticated, requireRole('wholesaler'), async (req, res) => {
    const mandiResult = await getMandiPrices({ state: req.query.state, commodity: req.query.commodity, limit: 30 });

    res.render('dashboards/wholesaler', {
        user: req.user,
        businessName: req.user.businessName || req.user.name + "'s Wholesale",
        mandi: mandiResult,
        states: COMMON_STATES,
        commodities: COMMON_COMMODITIES,
        selectedState: req.query.state || '',
        selectedCommodity: req.query.commodity || ''
    });
});

module.exports = router;
