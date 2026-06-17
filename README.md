# AgriConnect

A platform connecting farmers, sellers, workers, and wholesalers — with live Agmarknet mandi prices, real weather, and rule-based crop suggestions. No database; user accounts and demo data live in memory for the lifetime of the server process.

## Setup

1. **Install dependencies**
   ```
   npm install
   ```

2. **Create your `.env` file**
   ```
   cp .env.example .env
   ```
   Then fill in the values below.

3. **Google OAuth** (required for login)
   - Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
   - Create an OAuth Client ID (type: Web application).
   - Add `http://localhost:3001/auth/google/callback` as an authorized redirect URI.
   - Copy the Client ID and Client Secret into `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
   - **Important:** rotate any credentials that were ever hardcoded in source — treat them as compromised the moment they touch a file you might commit or share.

4. **data.gov.in API key** (required for live mandi prices)
   - Sign up at [data.gov.in](https://www.data.gov.in/).
   - Go to My Account → API Keys, generate a key.
   - Open the dataset "Current Daily Price of Various Commodities from Various Markets (Mandi)" and click the API tab (not the CSV/JSON export) to confirm the resource ID.
   - Put your key in `.env` as `DATA_GOV_IN_API_KEY`.

5. **OpenWeatherMap API key** (required for weather + crop suggestions)
   - Sign up at [openweathermap.org](https://openweathermap.org/).
   - Find your key under My API Keys.
   - New keys can take up to ~2 hours to activate — if you get 401 errors immediately after signup, that's why.
   - Put your key in `.env` as `OPENWEATHER_API_KEY`. We use only the free "Current Weather Data" endpoint, not One Call 3.0 (which requires a card on file).

6. **Run it**
   ```
   npm start
   ```
   Visit `http://localhost:3001`.

## How roles work

There's no separate password-based signup per role. Everyone logs in with Google. On first login, you're sent to `/select-role` to choose Farmer, Seller, Worker, or Wholesaler — that choice is stored against your Google profile ID in memory and determines which dashboard you land on.

## Known limitations (by design, given no-DB requirement)

- Restarting the server clears all users, roles, and any state. Nothing persists.
- Inventory, jobs, and store/business names in the Seller, Worker, and Wholesaler dashboards are demo/placeholder data — there's no "create listing" flow yet.
- Role, once chosen, can only be changed by editing `utils/userStore.js` in-memory state directly (there's no UI for it) — this is intentional friction matching the brief, but easy to extend with a settings page later.
- Mandi price and weather responses are cached in memory (30 min / 15 min respectively) to avoid hammering the government API and OpenWeatherMap's free tier rate limits.

## Project structure

```
app.js                  - entry point, wires sessions/passport/routes
config/passport.js      - Google OAuth strategy
routes/auth.js          - login, callback, role selection, logout
routes/dashboard.js     - role-gated dashboard routes
utils/userStore.js      - in-memory user map (replaces a DB)
utils/agmarknet.js      - data.gov.in mandi price client + cache
utils/weather.js        - OpenWeatherMap client + cache
utils/cropAdvisor.js    - rule-based crop suggestion engine
views/                  - EJS templates
public/css/shop.css     - shared stylesheet for farmer-shop-style pages
```
