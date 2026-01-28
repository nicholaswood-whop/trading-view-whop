# TradingView API Integration Notes

## Important Limitations

TradingView does **not** have a public API. The endpoints used in `tradingview.ts` are placeholders based on common patterns, but they may need to be adjusted based on:

1. **Actual TradingView Internal APIs**: These endpoints may need to be reverse-engineered or discovered through browser network inspection
2. **Cookie Authentication**: The session cookies (`sessionid` and `sessionid_sign`) are required for all requests
3. **Rate Limiting**: TradingView may have rate limits that aren't documented

## Implementation Options

### Option 1: Browser Automation (Puppeteer/Playwright)
- Use headless browser to interact with TradingView UI
- More reliable but slower and resource-intensive
- Requires maintaining browser automation code

### Option 2: Reverse-Engineered Endpoints
- Monitor network requests in browser DevTools
- Map out actual API endpoints TradingView uses
- More efficient but fragile (may break with TradingView updates)

### Option 3: TradingView Script Sharing
- Use TradingView's built-in sharing/invite features
- May require UI interaction simulation
- Most "official" approach but still not a public API

## Recommended Approach

For production, consider:
1. Start with reverse-engineered endpoints (current implementation)
2. Add comprehensive error handling and logging
3. Monitor for failures and adjust endpoints as needed
4. Consider browser automation as fallback for critical operations
5. Implement retry logic with exponential backoff

## Testing

Before deploying:
1. Test with real TradingView accounts
2. Verify cookie extraction process
3. Test grant/revoke operations
4. Monitor for cookie expiration
5. Test with various indicator types
