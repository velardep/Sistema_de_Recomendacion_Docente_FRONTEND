
export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface ProfilePreferences {
  tono: string;
  detalle: string;
}

export interface Profile {
  nombres: string;
  apellidos: string;
  unidad_educativa: string;
  nivel: string;
  grado: string;
  ciudad: string;
  departamento: string;
  preferencias: ProfilePreferences;
  avatar_url?: string;
  bio?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface EspacioChatMessage {
  rol: 'user' | 'assistant';
  contenido: string;
}

// Added Chat interface to fix import errors in chatsService
export interface Chat {
  id: string;
  titulo: string;
  created_at: string;
}

// Added Recomendacion interface to fix import errors in recomendacionesService
export interface Recomendacion {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
}

export interface Espacio {
  id: string;
  nombre: string;
  nivel: string;
  grado: string;
  materia: string;
  descripcion: string;
}

export interface ChatPlusResponse {
  user_message: EspacioChatMessage;
  assistant_message: EspacioChatMessage;
  recomendaciones: any[];
  busqueda: {
    docente: any[];
    global: any[];
    combinado: any[];
  };
}

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  perfil: Profile | null;
  loading: boolean;
  error: string | null;
}


export interface EspacioConversation {
  id: string;
  espacio_id: string;
  docente_id: string;
  titulo: string | null;
  created_at: string;
  updated_at?: string;
}

export interface EspacioMessageApi {
  id: string;
  conversacion_espacio_id: string;
  docente_id: string;
  rol: 'user' | 'assistant';
  contenido: string;
  metadatos?: any;
  created_at: string;
}
