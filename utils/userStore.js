// In-memory user store.
// No database per project requirements — this Map lives only as long as the
// Node process runs. Restarting the server clears all users and they will
// need to sign in again. Keyed by Google profile id.

const users = new Map();

const VALID_ROLES = ['farmer', 'seller', 'worker', 'wholesaler'];

function upsertUser(profile) {
    const existing = users.get(profile.id);
    if (existing) {
        return existing;
    }
    const newUser = {
        id: profile.id,
        name: profile.displayName,
        email: profile.emails && profile.emails[0] ? profile.emails[0].value : null,
        photo: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
        role: null, // chosen after first login, via /select-role
        // role-specific profile fields, filled in gradually as the user uses the app
        location: null,       // { lat, lon, name } - used for weather + market lookups
        storeName: null,      // sellers only
        skills: [],            // workers only
        businessName: null,    // wholesalers only
        createdAt: new Date()
    };
    users.set(profile.id, newUser);
    return newUser;
}

function getUser(id) {
    return users.get(id) || null;
}

function setUserRole(id, role) {
    if (!VALID_ROLES.includes(role)) {
        throw new Error(`Invalid role: ${role}`);
    }
    const user = users.get(id);
    if (!user) return null;
    user.role = role;
    users.set(id, user);
    return user;
}

function updateUser(id, fields) {
    const user = users.get(id);
    if (!user) return null;
    Object.assign(user, fields);
    users.set(id, user);
    return user;
}

module.exports = { upsertUser, getUser, setUserRole, updateUser, VALID_ROLES };
