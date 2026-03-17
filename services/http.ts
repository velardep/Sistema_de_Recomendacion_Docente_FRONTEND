
// services/http.ts
import { useAuthStore } from '../store/authStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class HttpError extends Error {
  status: number;
  data?: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function safeJson(t: string) {
  try { return JSON.parse(t); } catch { return t; }
}

// ===== NUEVO: manejo central de sesión expirada (401/403) =====
let __sessionExpiredHandling = false;

function handleSessionExpired(reason?: string) {
  if (__sessionExpiredHandling) return;
  __sessionExpiredHandling = true;

  try {
    // 1) Mensaje al usuario
    alert(
      reason ||
        'Tu sesión expiró por inactividad o tiempo límite. Vuelve a iniciar sesión.'
    );

    // 2) Limpieza de sesión
    useAuthStore.getState().logout();

    // 3) Redirección dura al login (y refresh)
    window.location.href = '/login';
  } finally {
    setTimeout(() => {
      __sessionExpiredHandling = false;
    }, 1000);
  }
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    ...(options.headers as any),
  };

  // (MISMO COMPORTAMIENTO QUE YA TIENES)
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  /*if (!res.ok) {
    const msg = (data as any)?.detail || (data as any)?.message || `HTTP ${res.status}`;
    throw new HttpError(res.status, msg, data);
  }*/
  if (!res.ok) {
    const msg = (data as any)?.detail || (data as any)?.message || `HTTP ${res.status}`;

    // ✅ NUEVO: si token expiró / forbidden, cerramos sesión
    if (res.status === 401 || res.status === 403) {
      handleSessionExpired(typeof msg === 'string' ? msg : undefined);
    }

    throw new HttpError(res.status, msg, data);
  }

  return data as T;
}










/**
 * POST FormData con progreso REAL de subida (upload.onprogress)
 * - NO usa localStorage
 * - Reusa el token desde authStore igual que request()
 * - NO setea Content-Type (FormData lo maneja solo)
 */
function postFormWithProgress<T>(
  path: string,
  form: FormData,
  opts?: {
    onProgress?: (percent: number, ev?: ProgressEvent) => void;
    timeoutMs?: number;
  }
): Promise<T> {
  const token = useAuthStore.getState().token;

  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE_URL}${path}`, true);

    // headers mínimos (mismo criterio que request())
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.timeout = 15 * 60 * 1000; // 15 minutos

    xhr.upload.onprogress = (ev) => {
      if (!opts?.onProgress) return;
      if (ev.lengthComputable) {
        const pct = Math.max(0, Math.min(100, Math.round((ev.loaded / ev.total) * 100)));
        opts.onProgress(pct, ev);
      } else {
        // si no computable, al menos avisamos “en progreso”
        opts.onProgress(1, ev);
      }
    };

    xhr.onload = () => {
      const text = xhr.responseText ?? '';
      const data = text ? safeJson(text) : null;

      /* {
        const msg = (data as any)?.detail || (data as any)?.message || `HTTP ${xhr.status}`;
        reject(new HttpError(xhr.status, msg, data));
        return;
      }*/
      if (xhr.status < 200 || xhr.status >= 300) {
        const msg = (data as any)?.detail || (data as any)?.message || `HTTP ${xhr.status}`;

        // ✅ NUEVO: si token expiró / forbidden, cerramos sesión
        if (xhr.status === 401 || xhr.status === 403) {
          handleSessionExpired(typeof msg === 'string' ? msg : undefined);
        }

        reject(new HttpError(xhr.status, msg, data));
        return;
      }

      resolve(data as T);
    };

    xhr.onerror = () => {
      reject(new HttpError(0, 'Error de red (upload)', null));
    };

    xhr.ontimeout = () => {
      reject(new HttpError(0, 'Timeout subiendo archivo', null));
    };

    try {
      xhr.send(form);
    } catch (e: any) {
      reject(new HttpError(0, e?.message ?? 'No se pudo iniciar el upload', null));
    }
  });
}










// ✅ NDJSON streaming helper (para application/x-ndjson)
// Lee el body por chunks y dispara onEvent por cada línea JSON.
async function postNdjsonStream(
  path: string,
  body: any,
  opts: {
    onEvent: (ev: any) => void;
    signal?: AbortSignal;
  }
): Promise<void> {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/x-ndjson',
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body ?? {}),
    signal: opts.signal,
  });

  /*if (!res.ok) {
    const text = await res.text();
    const data = text ? safeJson(text) : null;
    const msg = (data as any)?.detail || (data as any)?.message || `HTTP ${res.status}`;
    throw new HttpError(res.status, msg, data);
  }*/
  if (!res.ok) {
    const text = await res.text();
    const data = text ? safeJson(text) : null;
    const msg = (data as any)?.detail || (data as any)?.message || `HTTP ${res.status}`;

    // ✅ NUEVO: si token expiró / forbidden, cerramos sesión
    if (res.status === 401 || res.status === 403) {
      handleSessionExpired(typeof msg === 'string' ? msg : undefined);
    }

    throw new HttpError(res.status, msg, data);
  }

  if (!res.body) return;

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');

  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // NDJSON: eventos separados por "\n"
    let nl: number;
    while ((nl = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);

      if (!line) continue;

      try {
        const ev = JSON.parse(line);
        opts.onEvent(ev);
      } catch {
        // si viene basura, la ignoramos
      }
    }
  }

  // flush final por si quedó algo sin \n
  const last = buffer.trim();
  if (last) {
    try {
      opts.onEvent(JSON.parse(last));
    } catch {}
  }
}



async function postBlob(path: string, body?: any): Promise<Blob> {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  /*if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }*/
  if (!res.ok) {
    const text = await res.text();
    const data = text ? safeJson(text) : null;
    const msg = (data as any)?.detail || (data as any)?.message || text || `HTTP ${res.status}`;

    // ✅ NUEVO: si token expiró / forbidden, cerramos sesión
    if (res.status === 401 || res.status === 403) {
      handleSessionExpired(typeof msg === 'string' ? msg : undefined);
    }

    throw new HttpError(res.status, msg, data);
  }

  return await res.blob();
}

async function getBlob(path: string): Promise<Blob> {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers,
  });

  /*   const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }*/
  if (!res.ok) {
    const text = await res.text();
    const data = text ? safeJson(text) : null;
    const msg = (data as any)?.detail || (data as any)?.message || text || `HTTP ${res.status}`;

    // ✅ NUEVO: si token expiró / forbidden, cerramos sesión
    if (res.status === 401 || res.status === 403) {
      handleSessionExpired(typeof msg === 'string' ? msg : undefined);
    }

    throw new HttpError(res.status, msg, data);
  }

  return await res.blob();
}

async function del<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' });
}












export const http = {
  get:  <T>(path: string) => request<T>(path, { method: 'GET' }),

  post: <T>(path: string, body?: any) =>
    request<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: any) =>
    request<T>(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    }),

  postForm: <T>(path: string, form: FormData) =>
    request<T>(path, { method: 'POST', body: form }),

  // ✅ NUEVO
  postFormWithProgress,

  postNdjsonStream,

  postBlob,

  del,
  getBlob,

};

export { HttpError };

