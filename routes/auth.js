const express = require('express');
const passport = require('passport');
const router = express.Router();
const { setUserRole, VALID_ROLES } = require('../utils/userStore');

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/');
}

// Step 1: kick off Google OAuth
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Step 2: Google redirects back here
router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        if (!req.user.role) {
            return res.redirect('/select-role');
        }
        res.redirect(`/dashboard/${req.user.role}`);
    }
);

// Role selection — shown once, right after first login
router.get('/select-role', isAuthenticated, (req, res) => {
    if (req.user.role) {
        return res.redirect(`/dashboard/${req.user.role}`);
    }
    res.render('select-role', { user: req.user });
});

router.post('/select-role', isAuthenticated, (req, res) => {
    const { role } = req.body;
    if (!VALID_ROLES.includes(role)) {
        return res.status(400).send('Invalid role selected.');
    }
    const updated = setUserRole(req.user.id, role);
    req.login(updated, (err) => {
        if (err) return res.redirect('/select-role');
        res.redirect(`/dashboard/${updated.role}`);
    });
});

router.get('/logout', (req, res) => {
    req.logout(() => {
        req.session.destroy(() => {
            res.clearCookie('connect.sid');
            res.redirect('/');
        });
    });
});

module.exports = { router, isAuthenticated };
