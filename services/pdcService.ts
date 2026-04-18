// services/pdcService.ts

import { http } from './http';

export const pdcService = {
  generate: async (payload: any) => {
    return http.postBlob('/pdc/generate', payload);
  },
};