// services/espaciosService.ts
import { http } from './http';

export type Espacio = {
  id: string;
  nombre: string;
  nivel: string;
  grado: string;
  materia: string;
  descripcion?: string;
  created_at?: string;
};

export type EspacioConversation = {
  id: string;
  espacio_id: string;
  docente_id: string;
  titulo: string | null;
  created_at: string;
  updated_at?: string;
};

export type EspacioMessageApi = {
  id: string;
  conversacion_espacio_id: string;
  docente_id: string;
  rol: 'user' | 'assistant';
  contenido: string;
  metadatos?: any;
  created_at: string;
};

export type CrearChatEspacioResponse = EspacioConversation;

export type GetChatEspacioResponse = {
  conversation: EspacioConversation;
  messages: EspacioMessageApi[];
};

export type MessagesPlusEspacioResponse = {
  conversation?: EspacioConversation;
  user_message: EspacioMessageApi;
  assistant_message: EspacioMessageApi;
  recomendaciones?: any[];
};

export type CreateEspacioPayload = {
  nombre: string;
  nivel: string;
  grado: string;
  materia: string;
  descripcion?: string;
};

export const espaciosService = {
  list: () => http.get<Espacio[]>('/espacios'),

  get: (espacioId: string) => http.get<Espacio>(`/espacios/${espacioId}`),

  // ✅ crear espacio
  createEspacio: (payload: CreateEspacioPayload) =>
    http.post<Espacio>('/espacios', payload),

  // chat
  createChat: (espacioId: string, titulo?: string | null) =>
    http.post<CrearChatEspacioResponse>(`/espacios/${espacioId}/chat`, { titulo: titulo ?? null }),

  getChat: (espacioId: string, conversacionEspacioId: string) =>
    http.get<GetChatEspacioResponse>(`/espacios/${espacioId}/chat/${conversacionEspacioId}`),

  listChats: (espacioId: string) =>
    http.get<EspacioConversation[]>(`/espacios/${espacioId}/chat`),

  sendMessagePlus: (espacioId: string, conversacionEspacioId: string, content: string) =>
    http.post<MessagesPlusEspacioResponse>(`/espacios/${espacioId}/chat/messages-plus`, {
      conversacion_espacio_id: conversacionEspacioId,
      content,
    }),

  // subir archivos al espacio
  uploadArchivo: (espacioId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);

    return http.postForm<{ ok: boolean; chunks_insertados: number; archivo: string }>(
      `/espacios/${espacioId}/archivos`,
      form
    );
  },
};
