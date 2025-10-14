import type { Configuration, PopupRequest } from '@azure/msal-browser';

// Replace these with your actual values from Azure Portal
export const msalConfig: Configuration = {
  auth: {
    clientId: 'YOUR_APPLICATION_CLIENT_ID', // From Azure Portal - Application (client) ID
    authority: 'https://login.microsoftonline.com/common', // For personal and work accounts
    redirectUri: 'http://localhost:5173', // Must match Azure Portal configuration
    postLogoutRedirectUri: 'http://localhost:5173',
  },
  cache: {
    cacheLocation: 'sessionStorage', // Options: "sessionStorage" or "localStorage"
    storeAuthStateInCookie: false,
  },
};

export const loginRequest: PopupRequest = {
  scopes: ['User.Read', 'openid', 'profile', 'email'],
};

export const tokenRequest = {
  scopes: ['User.Read'],
};