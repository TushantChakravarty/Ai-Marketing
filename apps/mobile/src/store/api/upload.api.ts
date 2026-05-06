import API_CONFIG from '../../config/api.config';
import { ApiResponse } from '../../types';
import { StorageUtil } from '../../utils/storage.util';

interface UploadImageResult {
  url: string;
}

export const uploadImage = async (localUri: string): Promise<string> => {
  const token = await StorageUtil.getToken();
  const filename = localUri.split('/').pop() ?? 'photo.jpg';
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png', gif: 'image/gif', webp: 'image/webp',
  };

  const formData = new FormData();
  formData.append('file', {
    uri: localUri,
    name: filename,
    type: mimeMap[ext] ?? 'image/jpeg',
  } as unknown as Blob);

  const response = await fetch(`${API_CONFIG.BASE_URL}/upload/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(err?.message ?? 'Upload failed');
  }

  const json = await response.json() as ApiResponse<UploadImageResult>;
  return json.data.url;
};
