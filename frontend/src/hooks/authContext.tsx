// Global state for your user. This is a critical file.
// What you need to do:
// Use the useMsal() hook to get the MSAL account info (like email).
// Create a state for your backend user profile (userProfile: UserProfile | null).
// When the user logs in (or on app load), call authService.getUserProfile().
// Store this userProfile in the context.
// Provide the MSAL user, your userProfile, and a refetchProfile() function to the entire app.
// Create a useAuth() hook to easily access this context.