# Whop TradingView Indicators App

A Whop app that enables sellers to monetize their TradingView indicators by automatically granting and revoking access based on membership status.

## How It Works

### Seller Flow (Owners/Creators)
1. **Connect TradingView Account**: Sellers connect their TradingView account using session cookies
2. **Upload Indicators**: Sellers import/upload their TradingView indicators to the app
3. **Attach to Products**: Sellers attach indicators to Whop experiences/products for sale
4. **Automatic Management**: The app automatically grants/revokes access based on customer payments

### Buyer Flow (Customers)
1. **Purchase Membership**: Customers purchase a Whop membership/product that includes indicator access
2. **Enter TradingView Username**: When accessing the experience, customers enter their TradingView username
3. **Automatic Access**: Access is automatically granted when payment is active
4. **Automatic Revocation**: Access is automatically revoked when membership expires or is cancelled

## Features

### For Sellers
- Connect TradingView account using session cookies
- Import/upload indicators from TradingView account
- Attach indicators to Whop experiences/products
- Automatic access management based on customer payments
- View all indicators and their attached experiences

### For Buyers
- Enter TradingView username to receive indicator access
- Automatic access when membership/payment is active
- Automatic revocation when membership expires/cancels
- No manual intervention needed

## Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account (for database)
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

3. Set up Supabase database:
   - Create a project at https://supabase.com
   - Get your connection string from Settings > Database
   - Add it to `.env` as `DATABASE_URL`
   - Run migrations:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```
   
   See `SUPABASE_SETUP.md` for detailed Supabase setup instructions.

4. Run the development server:
```bash
npm run dev
```

## Environment Variables

Required environment variables (see `SETUP.md` for current configuration):

- `WHOP_API_KEY`: Your Whop API key from the developer dashboard
- `NEXT_PUBLIC_WHOP_APP_ID`: Your Whop App ID (for client-side use)
- `WHOP_WEBHOOK_SECRET`: Secret for verifying webhook requests
- `DATABASE_URL`: Supabase PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL (optional, for direct Supabase features)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key (optional)
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (optional, for admin operations)
- `JWT_SECRET`: NOT NEEDED - Whop handles JWT token verification automatically. We only decode the token.

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
