// What it is: Your central Axios instance.
// What you need to do:
// Create an Axios instance with axios.create().
// Set the baseURL to your Django API (e.g., http://localhost:8000/api).
// This is where you'll add the MSAL interceptor. You'll get the access token from MSAL and automatically add it to the Authorization header of every outgoing request.

// Can hold generic API response types.

// Switch for mock data or not
export const MOCK_MODE = false;

// Simulate network delay for mock calls
export const mockApiCall = <T>(data: T): Promise<T> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(data);
        }, 100);
    });
};