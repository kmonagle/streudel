import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes - reasonable caching to reduce requests
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.message?.startsWith('4')) return false;
        // Retry up to 2 times for potential network/cold start issues
        return failureCount < 2;
      },
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.message?.startsWith('4')) return false;
        // Retry once for potential cold start issues
        return failureCount < 1;
      },
    },
  },
});

// Keep-alive mechanism to prevent cold starts
const KEEP_ALIVE_INTERVAL = 4 * 60 * 1000; // 4 minutes

const keepAlive = async () => {
  try {
    await fetch('/api/health', { 
      method: 'GET',
      credentials: 'include'
    });
  } catch (error) {
    // Silently fail - this is just a keep-alive ping
    console.debug('Keep-alive ping failed:', error);
  }
};

// Start keep-alive when app loads (only in browser)
if (typeof window !== 'undefined') {
  // Initial ping after 1 minute
  setTimeout(keepAlive, 60 * 1000);
  
  // Then ping every 4 minutes to keep the server warm
  setInterval(keepAlive, KEEP_ALIVE_INTERVAL);
}
