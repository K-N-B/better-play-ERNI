// In summary, useApi.ts is an optional helper file, but it will make your component code much cleaner, more readable, and easier to maintain.

import { useState, useEffect, useCallback } from 'react';

// This hook is generic. <T> will be the type of data you expect back
export const useApi = <T>(
  // The hook takes the specific API function to call as an argument
  apiFunc: () => Promise<T>,
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunc();
      setData(result);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [apiFunc]); // The function is now a dependency

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // We return the state AND a 'refetch' function
  return { data, loading, error, refetch: fetchData };
};
