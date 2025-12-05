import { supabase } from "@/lib/supabaseClient";

/**
 * A wrapper around fetch that adds the Authorization header automatically.
 */
export async function secureFetch(url: string, options: RequestInit = {}) {
  // 1. Get the current session token from Supabase
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    console.error("No active session. Request blocked.");
    // Optional: Redirect to login if needed, or let the caller handle it
    throw new Error("Unauthorized: No session token");
  }

  // 2. Merge headers (keep existing headers like Content-Type)
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  // 3. Perform the actual fetch with the token
  const response = await fetch(url, {
    ...options,
    headers: headers,
  });

  // 4. Handle 401 (Token Expired / Invalid)
  if (response.status === 401) {
    console.error("Session expired or invalid.");
    // In a real app, you might trigger a logout here
  }

  return response;
}