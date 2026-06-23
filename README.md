# SIPRE — Frontend

Interfaz web del Sistema de Recomendación Docente. Construida con React y TypeScript, permite a los docentes chatear con IA, generar planificaciones (PDC), gestionar espacios de trabajo con sus propios documentos y ver recomendaciones pedagógicas personalizadas.

---

## Requisitos

- Node.js 20+
- Backend corriendo en `http://localhost:8000` (ver repo del backend)

---

## Variables de entorno

Crear un archivo `.env.local` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:8000
```

---

## Instalación y ejecución

```bash
npm install
npm run dev
```

Queda disponible en `http://localhost:3000`.

## Build para producción

```bash
npm run build
# Los archivos estáticos quedan en dist/
```
