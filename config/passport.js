const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { upsertUser, getUser } = require('../utils/userStore');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
(accessToken, refreshToken, profile, done) => {
    const user = upsertUser(profile);
    return done(null, user);
}
));

// Only the user id goes into the session cookie — the full profile is
// looked up from the in-memory store on every request via deserializeUser.
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    const user = getUser(id);
    if (!user) {
        return done(null, false);
    }
    done(null, user);
});

module.exports = passport;
