# Setup Instructions

## Environment Variables

Create a `.env` file in the root directory with the following:

```env
# Whop API Configuration
WHOP_API_KEY=apik_GxJk5njDYORKo_A2025384_C_371cedb8e332c4f704c35a5a98218d393e695f2faabcd4ef673b8fe721bf9a
NEXT_PUBLIC_WHOP_APP_ID=app_qwPSm3eGDCDIJK

# Whop Webhook Secret (get this from your Whop developer dashboard)
WHOP_WEBHOOK_SECRET=your_webhook_secret_here

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/whop_tradingview?schema=public"

# JWT Secret for token verification (optional)
JWT_SECRET=your_jwt_secret_here
```

## Current Configuration

- **Whop API Key**: ✅ Configured
- **Whop App ID**: ✅ Configured (`app_qwPSm3eGDCDIJK`)
- **Agent Username**: `tradingviews-agent94`
- **Agent ID**: `user_VBrXRfzveEMKw`

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up database:**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

3. **Verify configuration:**
   ```bash
   curl http://localhost:3000/api/config/verify
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## Next Steps

1. Set up your PostgreSQL database and update `DATABASE_URL`
2. Get your webhook secret from Whop dashboard and add it to `.env`
3. Configure webhook URL in Whop dashboard: `https://your-domain.com/api/webhooks/whop`
4. Test the connection with a real TradingView account

## Testing the API

You can test the Whop API connection by checking the health endpoint:
```bash
curl http://localhost:3000/api/health
```

And verify configuration:
```bash
curl http://localhost:3000/api/config/verify
```
