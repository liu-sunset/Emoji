export interface GenerateRequest {
  image_data: string;
  prompt: string;
}

export interface GenerateResponse {
  success: boolean;
  image_url?: string;
  error?: string;
  code?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const PASSWORD_KEY = 'emo_j_password';

function getPassword(): string {
  return localStorage.getItem(PASSWORD_KEY) || '';
}

export async function generateImage(request: GenerateRequest): Promise<GenerateResponse> {
  try {
    const password = getPassword();
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${password}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `请求失败: ${response.status}`,
        code: String(response.status),
      };
    }

    const data = await response.json();
    return {
      success: true,
      image_url: data.image_url,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message || '网络请求失败',
      };
    }
    return {
      success: false,
      error: '未知错误',
    };
  }
}
