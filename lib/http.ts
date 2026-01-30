
/**
 * STUB: En un entorno real, aquí configurarías Axios o Fetch
 * con interceptores para manejar el access_token y errores 401.
 */
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
