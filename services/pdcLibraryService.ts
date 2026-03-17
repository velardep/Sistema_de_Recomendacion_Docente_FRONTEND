import { http } from './http';

export const pdcLibraryService = {
  list: async () => {
    return http.get<any[]>('/pdc-library/list');
  },

  upload: async (file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    return http.postFormWithProgress<any>('/pdc-library/upload', form, {
      onProgress: (pct) => onProgress?.(pct),
    });
  },

  remove: async (id: string) => {
    return http.del<any>(`/pdc-library/delete/${id}`);
  },

  download: async (id: string) => {
    return http.getBlob(`/pdc-library/download/${id}`);
  },
};