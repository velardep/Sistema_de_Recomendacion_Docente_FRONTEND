
import { Recomendacion } from '../types';

/**
 * Contratos:
 * GET /recomendaciones -> array
 * POST /recomendaciones/{id}/acciones -> registra accion
 */
export const recomendacionesService = {
  list: async (): Promise<Recomendacion[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: "rec-1", titulo: "Aprender Rust", descripcion: "Basado en tu interés por TypeScript.", tipo: "curso" },
          { id: "rec-2", titulo: "Explorar Agentes de IA", descripcion: "Nuevas tendencias en LLMs.", tipo: "articulo" },
          { id: "rec-3", titulo: "Optimización de Vectores", descripcion: "Mejora tus búsquedas RAG.", tipo: "tutorial" }
        ]);
      }, 700);
    });
  },

  registerAction: async (id: string, action: string): Promise<void> => {
    return new Promise((resolve) => {
      console.log(`Accion registrada para ${id}: ${action}`);
      resolve();
    });
  }
};
