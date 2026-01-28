# Vercel Deployment Guide

## Prerequisites

Before deploying to Vercel, make sure you have:

1. ✅ A Supabase project set up
2. ✅ Your Supabase database connection string
3. ✅ Whop API credentials
4. ✅ All environment variables ready

## Environment Variables

Add these environment variables in Vercel Dashboard > Settings > Environment Variables:

### Required
```env
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Whop API
WHOP_API_KEY=apik_GxJk5njDYORKo_A2025384_C_371cedb8e332c4f704c35a5a98218d393e695f2faabcd4ef673b8fe721bf9a
NEXT_PUBLIC_WHOP_APP_ID=app_qwPSm3eGDCDIJK

# Whop Webhook
WHOP_WEBHOOK_SECRET=your_webhook_secret_here
```

### Optional
```env
# Supabase (if using direct Supabase features)
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT (optional)
JWT_SECRET=your_jwt_secret
```

## Build Configuration

The project is configured with:
- `postinstall` script: Automatically runs `prisma generate` after npm install
- `build` script: Runs `prisma generate && next build`
- `vercel.json`: Ensures Prisma client is generated during build

## Deployment Steps

1. **Connect your GitHub repository** to Vercel
2. **Add environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically:
   - Install dependencies
   - Run `prisma generate` (via postinstall)
   - Build the Next.js app
   - Deploy

## Troubleshooting

### Build Error: "Failed to collect page data"

This usually means:
1. **Prisma client not generated** - Check that `postinstall` script runs
2. **Missing DATABASE_URL** - Ensure it's set in Vercel environment variables
3. **Database connection issues** - Verify your Supabase connection string

### Fix: Ensure Prisma Client is Generated

The `postinstall` script should automatically generate the Prisma client. If it doesn't:

1. Check Vercel build logs for Prisma errors
2. Verify `DATABASE_URL` is set correctly
3. Make sure `prisma` is in dependencies (not devDependencies)

### Database Connection Issues

If you see database connection errors:
1. Verify your Supabase project is active
2. Check the connection string format
3. Ensure your IP is allowed (Supabase allows all by default)
4. For production, consider using connection pooling

## Post-Deployment

After successful deployment:

1. **Set up webhook URL** in Whop dashboard:
   ```
   https://your-app.vercel.app/api/webhooks/whop
   ```

2. **Test the health endpoint**:
   ```bash
   curl https://your-app.vercel.app/api/health
   ```

3. **Verify configuration**:
   ```bash
   curl https://your-app.vercel.app/api/config/verify
   ```

## Production Considerations

1. **Database Connection Pooling**: For production, use Supabase's connection pooler
2. **Environment Variables**: Use Vercel's environment variable management
3. **Build Optimization**: The build process is optimized for Vercel
4. **Error Monitoring**: Consider adding error tracking (Sentry, etc.)

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Prisma on Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
