# How to Extract TradingView Cookies

## Method 1: Browser Developer Tools (Chrome/Edge)

1. **Log into TradingView**
   - Go to https://www.tradingview.com
   - Log in with your account

2. **Open Developer Tools**
   - Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - Or right-click → Inspect

3. **Navigate to Cookies**
   - Click the **Application** tab (Chrome) or **Storage** tab (Firefox)
   - In the left sidebar, expand **Cookies**
   - Click on `https://www.tradingview.com`

4. **Find the Required Cookies**
   - Look for `sessionid` - copy its **Value**
   - Look for `sessionid_sign` - copy its **Value**

5. **Use in the App**
   - Paste these values into the seller dashboard connection form

## Method 2: Browser Extension

You can use a browser extension like "Cookie Editor" to export cookies:
1. Install Cookie Editor extension
2. Navigate to TradingView
3. Click the extension icon
4. Find and copy `sessionid` and `sessionid_sign` values

## Method 3: JavaScript Console

1. Open Developer Tools Console
2. Run:
```javascript
document.cookie.split(';').forEach(cookie => {
  const [name, value] = cookie.trim().split('=');
  if (name === 'sessionid' || name === 'sessionid_sign') {
    console.log(`${name}: ${value}`);
  }
});
```

## Important Notes

- **Cookie Expiration**: These cookies expire after some time (usually 30 days or when you log out)
- **Security**: Never share these cookies publicly - they provide full access to your TradingView account
- **Refresh**: If access stops working, you likely need to refresh your cookies
- **One Account**: Only one TradingView account can be connected per Whop company at a time
