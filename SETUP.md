# Setup Instructions

## Environment Variables

Create a `.env` file in the root directory with the following:

```env
# Whop API Configuration
WHOP_API_KEY=apik_GxJk5njDYORKo_A2025384_C_371cedb8e332c4f704c35a5a98218d393e695f2faabcd4ef673b8fe721bf9a
NEXT_PUBLIC_WHOP_APP_ID=app_qwPSm3eGDCDIJK

# Whop Webhook Secret (get this from your Whop developer dashboard)
WHOP_WEBHOOK_SECRET=your_webhook_secret_here

# Supabase Database
# Get your connection string from: Supabase Dashboard > Settings > Database > Connection string
# Use the "URI" format for Prisma migrations
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

# Supabase Configuration (optional, for direct Supabase features)
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT_SECRET is NOT needed - Whop handles JWT verification automatically
# We only decode the token, not verify it, since Whop already verified it
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

2. **Set up Supabase:**
   - Create a project at https://supabase.com
   - Get your database connection string from: Settings > Database > Connection string
   - Copy the "URI" format and add it to `.env` as `DATABASE_URL`
   - (Optional) Add Supabase URL and keys for direct Supabase features
   
3. **Set up database schema:**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```
   
   **Note:** For Supabase, you may need to use the direct connection (not pooled) for migrations:
   ```bash
   # Use direct connection for migrations
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" npx prisma migrate dev
   ```

4. **Verify configuration:**
   ```bash
   curl http://localhost:3000/api/config/verify
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

## Next Steps

1. **Set up Supabase:**
   - Create a project at https://supabase.com
   - Get your database connection string and add it to `.env`
   - Run migrations: `npx prisma migrate dev`
   
2. **Get your webhook secret** from Whop dashboard and add it to `.env`

3. **Configure webhook URL** in Whop dashboard: `https://your-domain.com/api/webhooks/whop`

4. **Test the connection** with a real TradingView account

## Testing the API

You can test the Whop API connection by checking the health endpoint:
```bash
curl http://localhost:3000/api/health
```

And verify configuration:
```bash
curl http://localhost:3000/api/config/verify
```
