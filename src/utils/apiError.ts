import { globalShowApiError } from '../App';
import type { ApiError } from '../hooks/useApiError';

/**
 * Parse a non-ok fetch Response into an ApiError object, then
 * show the global popup. Returns the parsed error.
 */
export async function handleApiError(res: Response): Promise<ApiError> {
  let err: ApiError;
  try {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      err = {
        statusCode: data.statusCode ?? res.status,
        errorCode: data.errorCode,
        message: data.message,
        detail: data.detail,
      };
    } else {
      const text = await res.text();
      const isHtml = text.trim().startsWith('<');
      err = {
        statusCode: res.status,
        errorCode: res.status === 503 ? 'API_KEY_MISSING' : 'INTERNAL_ERROR',
        message: isHtml
          ? 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend đang chạy.'
          : (text.slice(0, 300) || `Lỗi HTTP ${res.status}`),
      };
    }
  } catch {
    err = {
      statusCode: res.status,
      errorCode: 'INTERNAL_ERROR',
      message: `Lỗi HTTP ${res.status}. Không thể đọc phản hồi từ máy chủ.`,
    };
  }

  if (res.status !== 401) {
    globalShowApiError?.(err);
  }
  return err;
}
