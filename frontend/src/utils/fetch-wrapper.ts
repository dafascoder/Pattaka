import { APIResponse } from "@/types/api";

export const fetchWrapper = async (url: string, options: RequestInit = {}): Promise<APIResponse> => {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || (typeof window !== 'undefined' 
    ? window.location.origin.replace(':3000', ':8080') 
    : 'http://localhost:8080');
    
  const fullUrl = `${baseUrl}${url}`;
  
  // In server-side context, we need to forward cookies from the request
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Add any headers from options
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, options.headers);
    }
  }
  
  // If we're running on the server and don't have explicit cookies, try to get them
  if (typeof window === 'undefined') {
    try {
      // Try to import server utilities for cookie forwarding
      const { getHeaders } = await import('@tanstack/react-start/server');
      const serverHeaders = getHeaders();
      const cookieHeader = serverHeaders['cookie'];
      
      if (cookieHeader && !headers['Cookie'] && !headers['cookie']) {
        headers['Cookie'] = cookieHeader;
      }
    } catch (e) {
      // Ignore if server utilities aren't available
    }
  }
  
  const response = await fetch(fullUrl, {
    ...options,
    credentials: 'include',
    headers,
  });
  
  if (!response.ok) {
    let error;
    try {
      error = await response.json();
    } catch {
      error = { message: `HTTP ${response.status}: ${response.statusText}` };
    }
    throw new Error(error.message || error.error || 'Request failed');
  }
  
  const data = await response.json();
  return data as APIResponse;
};