import { QueryClient } from "@tanstack/react-query";

/**
 * Query cache configuration with optimized settings
 * 
 * Stale time: How long data is considered fresh (5 minutes)
 * Cache time: How long inactive data remains in cache (30 minutes)
 * Retry: Number of times to retry failed queries (2 times)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff with max 30s
      staleTime: 1000 * 60 * 5, // 5 minutes (data considered fresh)
      gcTime: 1000 * 60 * 30, // 30 minutes (data kept in cache)
    },
    mutations: {
      retry: 1,
      retryDelay: 1000, // 1 second delay between mutation retries
    },
  },
});

// API helper functions
/**
 * Helper function for making API requests with consistent error handling
 * 
 * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param path - API endpoint path
 * @param data - Optional data to send in the request body
 * @returns Response object from the API
 * @throws Error with details about the failed request
 */
export async function apiRequest(
  method: string,
  path: string,
  data?: any
): Promise<Response> {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(path, options);

    if (!response.ok) {
      // Get more detailed error information if available
      let errorDetail = '';
      try {
        const errorData = await response.json();
        errorDetail = errorData.message || errorData.error || '';
      } catch (parseError) {
        // If error response isn't valid JSON, use status text
        errorDetail = response.statusText;
      }

      // Throw error with specific status code and message
      throw new Error(`API request failed (${response.status}): ${errorDetail}`);
    }

    return response;
  } catch (error) {
    // Handle network errors separately from API errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Network error: Unable to connect to the server. Please check your connection.`);
    }
    
    // Rethrow the existing error (either our API error or another error)
    throw error;
  }
}