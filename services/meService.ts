// services/meService.ts
import { http } from './http';

export type MeResponse = {
  user: any;
  perfil: any | null;
};

export const meService = {
  getMe: () => http.get<MeResponse>('/me'),

  // UPSERT del perfil (tu backend es POST /me)
  upsertMe: (body: {
    nombres: string;
    apellidos: string;
    unidad_educativa: string;
    nivel: string;
    grado: string;
    ciudad: string;
    departamento: string;
    preferencias: { tono: string; detalle: string };
  }) => http.post<any>('/me', body),
};
