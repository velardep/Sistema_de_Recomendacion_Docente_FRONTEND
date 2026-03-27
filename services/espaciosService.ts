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

export type EspacioArchivo = {
  id: string;
  docente_id: string;
  espacio_id: string;
  filename_original: string;
  mime_type?: string | null;
  size_bytes?: number | null;
  file_hash?: string | null;
  total_chunks?: number;
  estado: 'processing' | 'processed' | 'failed';
  error_detail?: string | null;
  created_at?: string;
};

export type UploadArchivoEspacioResponse = {
  ok: boolean;
  chunks_insertados: number;
  archivo: string;
  detail?: string;
};

export const espaciosService = {
  list: () => http.get<Espacio[]>('/espacios'),

  get: (espacioId: string) => http.get<Espacio>(`/espacios/${espacioId}`),

  // crear espacio
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

  // Sube un archivo al espacio y devuelve el resultado del procesamiento.
  uploadArchivo: (
    espacioId: string,
    file: File,
    onProgress?: (percent: number) => void
  ) => {
    const form = new FormData();
    form.append('file', file);

    return http.postFormWithProgress<UploadArchivoEspacioResponse>(
      `/espacios/${espacioId}/archivos`,
      form,
      { onProgress }
    );
  },

    // Lista los archivos registrados del espacio.
    listArchivos: (espacioId: string) =>
      http.get<EspacioArchivo[]>(`/espacios/${espacioId}/archivos`),

    // Elimina el archivo del espacio y todo su procesamiento asociado.
    deleteArchivo: (espacioId: string, fileId: string) =>
      http.delete<{ ok: boolean; detail?: string }>(`/espacios/${espacioId}/archivos/${fileId}`),
    

    
  
};
