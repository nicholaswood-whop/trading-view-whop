# Whop TradingView Indicators App

A Whop app that enables sellers to monetize their TradingView indicators by automatically granting and revoking access based on membership status.

## Features

### For Sellers
- Connect TradingView account using session cookies
- Automatically import indicators from TradingView
- Attach indicators to Whop experiences/products
- Manage indicator access

### For Buyers
- Enter TradingView username to receive indicator access
- Automatic access when membership is active
- Automatic revocation when membership expires/cancels

## Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL database
- Whop API key
- Whop webhook secret

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. Set up the database:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. Run the development server:
```bash
npm run dev
```

## Environment Variables

Required environment variables (see `SETUP.md` for current configuration):

- `WHOP_API_KEY`: Your Whop API key from the developer dashboard
- `NEXT_PUBLIC_WHOP_APP_ID`: Your Whop App ID (for client-side use)
- `WHOP_WEBHOOK_SECRET`: Secret for verifying webhook requests
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT token verification (optional, Whop handles verification)

**Current Configuration:**
- ✅ Whop API Key: Configured
- ✅ Whop App ID: `app_qwPSm3eGDCDIJK`
- ✅ Agent: `tradingviews-agent94` (ID: `user_VBrXRfzveEMKw`)

See `SETUP.md` for detailed setup instructions.

## TradingView Integration

**Important**: TradingView does not have a public API. This app uses cookie-based authentication with `sessionid` and `sessionid_sign` cookies.

### Getting TradingView Cookies

1. Log into TradingView in your browser
2. Open Developer Tools (F12)
3. Go to Application/Storage → Cookies → tradingview.com
4. Copy the values for `sessionid` and `sessionid_sign`

**Note**: These cookies may expire. If access fails, sellers need to refresh their cookies.

## API Endpoints

### Seller Endpoints

- `POST /api/seller/connect` - Connect TradingView account
- `DELETE /api/seller/connect` - Disconnect TradingView account
- `GET /api/seller/indicators` - Get all indicators
- `POST /api/seller/indicators` - Import/refresh indicators
- `POST /api/seller/indicators/[id]/attach` - Attach indicator to experience

### Buyer Endpoints

- `POST /api/buyer/access` - Grant access to indicator

### Webhooks

- `POST /api/webhooks/whop` - Handle Whop membership events

## Webhook Events

The app handles the following Whop webhook events:
- `membership.created` - Grant access
- `membership.updated` - Update access status
- `membership.cancelled` - Revoke access
- `membership.expired` - Revoke access
- `membership.past_due` - Revoke access

## Database Schema

- `TradingViewConnection` - Seller's TradingView account connection
- `TradingViewIndicator` - Imported indicators
- `UserIndicatorAccess` - Buyer access mappings
- `WebhookEvent` - Webhook event log

## Deployment

1. Build the application:
```bash
npm run build
```

2. Set up production database and run migrations:
```bash
npx prisma migrate deploy
```

3. Configure webhook URL in Whop dashboard:
   - Point to: `https://your-domain.com/api/webhooks/whop`

## Limitations

- TradingView has no public API, so cookie-based authentication is required
- Cookies may expire and need to be refreshed
- If a buyer changes their TradingView username, access cannot be automatically revoked
- Only one TradingView account per Whop company is supported

## Security Notes

- All API endpoints require Whop JWT authentication via `x-whop-user-token` header
- TradingView cookies are stored encrypted in the database
- Webhook events are logged for debugging and audit purposes

## License

MIT
