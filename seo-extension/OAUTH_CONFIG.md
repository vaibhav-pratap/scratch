# OAuth Configuration

## Development vs Production

This extension supports two OAuth configurations:

### Development (Current)
- **Client Type**: Web Application
- **Client ID**: `106325929364-bkc4a5r01g7o32vjc15umc64bdqg6l7q`
- **Auth Method**: `launchWebAuthFlow`
- **Use Case**: Testing unpublished extension

### Production (Publishing)
- **Client Type**: Chrome Extension
- **Client ID**: `106325929364-rcs850a9c7qircjrsn50988c6t4maka0`
- **Auth Method**: `getAuthToken`
- **Use Case**: Published extension on Chrome Web Store

## Switching to Production

When publishing to Chrome Web Store:

1. **Update `js/services/auth.js`**:
   ```javascript
   const IS_DEV = false; // Change from true to false
   ```

2. **Update `manifest.json`**:
   Add the oauth2 configuration:
   ```json
   "oauth2": {
     "client_id": "106325929364-rcs850a9c7qircjrsn50988c6t4maka0.apps.googleusercontent.com",
     "scopes": [
       "profile",
       "email",
       "https://www.googleapis.com/auth/webmasters.readonly"
     ]
   }
   ```

3. **Google Cloud Console**:
   - Ensure the Chrome Extension OAuth client has your published extension's ID in the "Item ID" field

## Security

Both `client_secret_*.json` files are gitignored and will never be committed to version control.
