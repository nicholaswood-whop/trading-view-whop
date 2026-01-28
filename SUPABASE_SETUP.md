# Supabase Setup Guide

This app uses Supabase for database storage. Supabase provides a PostgreSQL database with additional features like real-time subscriptions, storage, and authentication.

## Getting Started with Supabase

### 1. Create a Supabase Project

1. Go to https://supabase.com and sign up/login
2. Click "New Project"
3. Fill in your project details:
   - Name: `whop-tradingview-app` (or your preferred name)
   - Database Password: Choose a strong password (save this!)
   - Region: Choose the closest region to your users

### 2. Get Your Connection String

1. In your Supabase project dashboard, go to **Settings** > **Database**
2. Scroll down to **Connection string**
3. Select **URI** format
4. Copy the connection string - it will look like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### 3. Configure Environment Variables

Add to your `.env` file:

```env
# Supabase Database Connection
# Use direct connection for Prisma migrations
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Optional: For direct Supabase client features (real-time, storage, etc.)
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Where to find the keys:**
- `NEXT_PUBLIC_SUPABASE_URL`: Your project URL (Settings > API > Project URL)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Settings > API > Project API keys > `anon` `public`
- `SUPABASE_SERVICE_ROLE_KEY`: Settings > API > Project API keys > `service_role` `secret`

### 4. Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations to create tables
npx prisma migrate dev --name init
```

**Important:** For Supabase, use the direct connection (port 5432) for migrations, not the connection pooler.

### 5. Verify Connection

Check that your database is connected:

```bash
# Test the connection
curl http://localhost:3000/api/health
```

You should see:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

## Connection Pooling (Production)

For production, Supabase recommends using connection pooling:

1. **For Prisma (server-side):** Use the direct connection (port 5432)
2. **For connection pooling (if needed):** Use port 6543 with `pgbouncer=true`

Example pooled connection:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

## Supabase Features Available

### Current Setup
- ✅ PostgreSQL database via Prisma ORM
- ✅ Automatic migrations
- ✅ Type-safe database queries

### Optional Features (if you add Supabase client)
- Real-time subscriptions
- File storage
- Row Level Security (RLS)
- Authentication (if needed)

## Troubleshooting

### Migration Issues

If migrations fail, make sure you're using the direct connection (port 5432), not the pooler:

```bash
# Check your DATABASE_URL
echo $DATABASE_URL

# Should be: postgresql://...@db.[PROJECT-REF].supabase.co:5432/...
# NOT: ...pooler.supabase.com:6543/...
```

### Connection Timeout

If you get connection timeouts:
1. Check your Supabase project is active
2. Verify your IP is allowed (Supabase allows all IPs by default)
3. Check your password is correct

### Schema Sync

To sync your Prisma schema with Supabase:
```bash
# Pull schema from Supabase
npx prisma db pull

# Or push schema to Supabase
npx prisma db push
```

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Prisma with Supabase](https://supabase.com/docs/guides/integrations/prisma)
- [Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
