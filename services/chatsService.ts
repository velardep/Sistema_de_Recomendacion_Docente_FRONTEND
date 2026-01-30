// services/chatsService.ts
import { http } from './http';

export type Chat = {
  id: string;
  docente_id: string;
  titulo: string;
  created_at: string;
  updated_at: string;
};

export type ChatMessageApi = {
  id: string;
  conversation_id: string;
  docente_id: string;
  role: 'user' | 'assistant';
  content: string;
  meta?: any;
  created_at: string;
};

export type CreateChatResponse = Chat;

export type MessagesPlusResponse = {
  user_message: ChatMessageApi;
  assistant_message: ChatMessageApi;
  recomendaciones_mock?: any[];
  recomendaciones_embeddings?: any[];
  conversation?: Chat;
};

export type GetChatResponse = {
  conversation: Chat;
  messages: ChatMessageApi[];
};

export const chatsService = {
  listChats: () => http.get<Chat[]>('/chats'),
  
  createChat: (titulo: string) =>
    http.post<CreateChatResponse>('/chats', { titulo }),

  getChat: (chatId: string) =>
    http.get<GetChatResponse>(`/chats/${chatId}`),

  sendMessagePlus: (chatId: string, content: string) =>
    http.post<MessagesPlusResponse>(`/chats/${chatId}/messages-plus`, { content }),
};
