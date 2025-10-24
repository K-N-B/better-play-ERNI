// API Configuration
export const MOCK_MODE = false; // Change to false to use real backend
export const API_BASE_URL = 'http://localhost:8000/api';

// Mock API delay for testing (only used when MOCK_MODE = true)
export const mockApiCall = <T>(data: T, delay: number = 500): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

// Helper function for making authenticated API calls
export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    credentials: 'include', // Always include cookies for session auth
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };
  
  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    // Try to parse error message from response
    const error = await response.json().catch(() => ({ 
      error: `HTTP ${response.status}: ${response.statusText}` 
    }));
    throw new Error(error.error || error.message || 'API call failed');
  }
  
  // Handle null responses (e.g., getSavedProgress returns null)
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}