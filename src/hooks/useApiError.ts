import { useState, useCallback } from 'react';

export interface ApiError {
  statusCode?: number;
  errorCode?: string;
  message?: string;
  detail?: string;
}

/**
 * Parse a fetch Response and extract a structured ApiError.
 * Returns null if the response is OK.
 */
export async function parseApiError(res: Response): Promise<ApiError | null> {
  if (res.ok) return null;
  try {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      return {
        statusCode: data.statusCode ?? res.status,
        errorCode: data.errorCode,
        message: data.message,
        detail: data.detail,
      };
    }
    // Non-JSON response (e.g. HTML from ngrok error page)
    const text = await res.text();
    const isHtml = text.trim().startsWith('<');
    return {
      statusCode: res.status,
      errorCode: res.status === 503 ? 'API_KEY_MISSING' : 'INTERNAL_ERROR',
      message: isHtml
        ? 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend đang chạy.'
        : text.slice(0, 200),
      detail: isHtml ? undefined : text,
    };
  } catch {
    return {
      statusCode: res.status,
      errorCode: 'INTERNAL_ERROR',
      message: `Lỗi HTTP ${res.status}. Không thể đọc phản hồi từ máy chủ.`,
    };
  }
}

/**
 * Hook to manage a global API error popup state.
 */
export function useApiError() {
  const [apiError, setApiError] = useState<ApiError | null>(null);

  const showError = useCallback((err: ApiError) => setApiError(err), []);
  const clearError = useCallback(() => setApiError(null), []);

  /**
   * Wrap a fetch call — automatically shows popup on error.
   * Returns the Response if ok, null if error.
   */
  const safeFetch = useCallback(async (
    input: RequestInfo,
    init?: RequestInit
  ): Promise<Response | null> => {
    try {
      const res = await fetch(input, init);
      if (!res.ok) {
        const err = await parseApiError(res.clone());
        if (err) setApiError(err);
        return null;
      }
      return res;
    } catch (networkErr) {
      setApiError({
        statusCode: 0,
        errorCode: 'NETWORK_ERROR',
        message: 'Không thể kết nối đến máy chủ. Kiểm tra backend đang chạy và kết nối mạng.',
        detail: String(networkErr),
      });
      return null;
    }
  }, []);

  return { apiError, showError, clearError, safeFetch };
}
