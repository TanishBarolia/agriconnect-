require('dotenv').config();

const express = require('express');
const session = require('express-session');
const passport = require('./config/passport');

const { router: authRoutes } = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3001;
const SESSION_TIMEOUT = 15 * 60 * 60 * 1000; // 15 hours

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'dev_only_fallback_secret_change_me',
    resave: true,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        maxAge: SESSION_TIMEOUT,
        httpOnly: true,
        secure: false, // set true once served over HTTPS in production
        sameSite: 'lax'
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// ------------------- ROUTES -------------------

app.get('/', (req, res) => {
    res.render('homepage', { user: req.user || null });
});

app.use('/', authRoutes);
app.use('/', dashboardRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', { user: req.user || null });
});

app.listen(PORT, () => console.log(`AgriConnect running on http://localhost:${PORT}`));
