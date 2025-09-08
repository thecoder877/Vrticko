# Debug Utilities

This document explains how to use the debugging utilities available in the Vrtićko application.

## Available Global Objects

When the application is running, the following objects are available in the browser console:

### `window.React`
- The React library
- Useful for debugging React components and hooks

### `window.supabase`
- The Supabase client instance
- Use this to make direct database queries or test authentication

### `window.supabaseAdmin`
- The Supabase admin client instance
- Has elevated permissions for admin operations

### `window.authContext`
- Contains the current authentication context
- Properties:
  - `user`: Current user object (or null if not logged in)
  - `loading`: Boolean indicating if auth is still loading
  - `signOut`: Function to sign out the current user

### `window.testSupabaseConnection()`
- Function to test if Supabase connection is working
- Returns a Promise that resolves to true/false

### `window.getCurrentUserInfo()`
- Function to get current user information
- Logs user info to console and returns the user object

## Usage Examples

### Check if React and Supabase are available:
```javascript
console.log('React context:', window.React);
console.log('Supabase import:', window.supabase);
```

### Test Supabase connection:
```javascript
window.testSupabaseConnection().then(success => {
  console.log('Connection test result:', success);
});
```

### Get current user info:
```javascript
const user = window.getCurrentUserInfo();
console.log('Current user:', user);
```

### Check auth context:
```javascript
console.log('Auth context:', window.authContext);
console.log('User:', window.authContext?.user);
console.log('Loading:', window.authContext?.loading);
```

### Make a direct Supabase query:
```javascript
window.supabase
  .from('users')
  .select('*')
  .then(({ data, error }) => {
    console.log('Users:', data);
    console.log('Error:', error);
  });
```

### Sign out using the context:
```javascript
if (window.authContext?.signOut) {
  window.authContext.signOut();
}
```

## Troubleshooting

### Common Issues

1. **"require is not defined" error**: This was fixed by replacing `require()` calls with ES6 imports
2. **"React context: undefined"**: Make sure the app has loaded completely before testing
3. **"Supabase import: undefined"**: Check that the Supabase client is properly initialized

### Testing

You can test the debugging utilities by:
1. Opening the browser console
2. Running the test commands listed above
3. Or opening `test-debug.html` in your browser

## Notes

- These utilities are only available in development/debugging mode
- They should not be used in production code
- The global objects are updated automatically when the auth context changes
- All functions are available immediately after the page loads
- Fixed compatibility issues with ES modules and browser environment
