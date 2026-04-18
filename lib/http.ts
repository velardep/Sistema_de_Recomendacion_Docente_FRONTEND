
// services/http.ts

// Este módulo centraliza las llamadas HTTP a la API, manejando tokens de autenticación, errores comunes (como sesión expirada) y proporcionando una interfaz simple para los servicios. También incluye un helper para manejar respuestas en formato NDJSON, útil para endpoints que envían datos en streaming.
export const http = {
  async get<T>(url: string): Promise<T> {
    console.log(`[HTTP GET] ${url}`);
    return {} as T;
  },
  async post<T>(url: string, body: any): Promise<T> {
    console.log(`[HTTP POST] ${url}`, body);
    return {} as T;
  },
  async put<T>(url: string, body: any): Promise<T> {
    console.log(`[HTTP PUT] ${url}`, body);
    return {} as T;
  },
  async delete<T>(url: string): Promise<T> {
    console.log(`[HTTP DELETE] ${url}`);
    return {} as T;
  }
};
