import { QueryClient } from "@tanstack/react-query";
import { withProfile } from "./profile";

/**
 * Query cache configuration with optimized settings
 * 
 * Stale time: How long data is considered fresh (5 minutes)
 * Cache time: How long inactive data remains in cache (30 minutes)
 * Retry: Number of times to retry failed queries (2 times)
 */
// Default fetcher: builds the URL from the query key (e.g. ["/api/community", id]
// → "/api/community/<id>"). Screens can still pass an explicit queryFn to override.
// A 401 means the household session expired or this device isn't trusted yet.
// Tell the AuthGate to drop back to the lock screen.
export function onAuthExpired() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("hh-auth-locked"));
}

const defaultQueryFn = async ({ queryKey }: { queryKey: readonly unknown[] }) => {
  const url = withProfile(queryKey.map((part) => String(part)).join("/"));
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) {
    if (res.status === 401) onAuthExpired();
    throw new Error(`API request failed (${res.status})`);
  }
  return res.json();
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
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
    const response = await fetch(withProfile(path), options);

    if (response.status === 401) onAuthExpired();

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