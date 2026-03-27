import React, { useEffect, useMemo, useRef, useState } from 'react';
import { espaciosService, type EspacioArchivo as EspacioArchivoApi } from '../../services/espaciosService';
import type { Espacio, EspacioConversation, EspacioMessageApi } from '../../types';
import { IconPlus, IconSend, IconGrid, IconChat } from '../../shared/components/Icons';

type UiMsg = { role: 'user' | 'assistant'; content: string };

type EspacioArchivo = EspacioArchivoApi;

const safeArray = <T,>(v: any): T[] => (Array.isArray(v) ? v : []);
const safeString = (v: any): string => (typeof v === 'string' ? v : (v == null ? '' : String(v)));

type CreateEspacioForm = {
  nombre: string;
  nivel: string;
  grado: string;
  materia: string;
  descripcion: string;
};


const FRONT_ALLOWED_EXTENSIONS = ['.pdf', '.docx'];
const FRONT_MAX_FILE_BYTES = 8 * 1024 * 1024;

function getFileExtension(filename: string): string {
  const lower = (filename || '').toLowerCase().trim();
  const idx = lower.lastIndexOf('.');
  return idx >= 0 ? lower.slice(idx) : '';
}




const EspaciosSection: React.FC = () => {
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [selectedEspacio, setSelectedEspacio] = useState<Espacio | null>(null);

  const [convs, setConvs] = useState<EspacioConversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<EspacioConversation | null>(null);

  const [messages, setMessages] = useState<UiMsg[]>([]);
  const [input, setInput] = useState('');

  const [loadingEspacios, setLoadingEspacios] = useState(true);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Layout UI states
const [showChatsSidebar, setShowChatsSidebar] = useState(true);
const [activeTab, setActiveTab] = useState<'chat' | 'archivos'>('chat');
const [showEspaciosSidebar, setShowEspaciosSidebar] = useState(true);
const [showTopPanel, setShowTopPanel] = useState(() => window.innerWidth >= 1024);

  // Drawers móvil
  const [mobileEspaciosOpen, setMobileEspaciosOpen] = useState(false);
  const [mobileChatsOpen, setMobileChatsOpen] = useState(false);

  // ESTADO PARA ARCHIVOS
  const [loadingArchivos, setLoadingArchivos] = useState(false);
  const [archivosErr, setArchivosErr] = useState<string | null>(null);
  const [archivos, setArchivos] = useState<EspacioArchivo[]>([]);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [archivoActionMsg, setArchivoActionMsg] = useState<string | null>(null);

  // para ocultar/mostrar el apartado dentro de la tab Archivos
  const [showArchivosPanel, setShowArchivosPanel] = useState(true);

  // autoscroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  // auto resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = '0px';
    const next = Math.min(el.scrollHeight, 160);
    el.style.height = `${next}px`;
  }, [input]);

    // responsive: mostrar/ocultar paneles según tamaño
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) {
        setShowTopPanel(true);
      }
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // -----------------------------
  // Crear espacio (modal)
  // -----------------------------
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateEspacioForm>({
    nombre: '',
    nivel: '',
    grado: '',
    materia: '',
    descripcion: '',
  });

  const resetForm = () =>
    setForm({ nombre: '', nivel: '', grado: '', materia: '', descripcion: '' });

  const refreshEspacios = async () => {
    const list = await espaciosService.list();
    setEspacios(list);
    return list;
  };

  const handleCreateEspacio = async () => {
    setErr(null);

    const payload = {
      nombre: form.nombre.trim(),
      nivel: form.nivel.trim(),
      grado: form.grado.trim(),
      materia: form.materia.trim(),
      descripcion: form.descripcion.trim(),
    };

    if (!payload.nombre || !payload.nivel || !payload.grado || !payload.materia) {
      setErr('Completa: nombre, nivel, grado y materia.');
      return;
    }

    setCreating(true);
    try {
      const created = await espaciosService.createEspacio(payload);

      const list = await refreshEspacios();
      const nuevo = list.find((x) => x.id === created.id) || (created as any);

      setOpenCreate(false);
      resetForm();

      await selectEspacio(nuevo);
    } catch (e: any) {
      setErr(e?.message ?? 'No se pudo crear el espacio');
    } finally {
      setCreating(false);
    }
  };

  // load espacios
  useEffect(() => {
    const load = async () => {
      setErr(null);
      setLoadingEspacios(true);
      try {
        await refreshEspacios();
      } catch (e: any) {
        setErr(e?.message ?? 'No se pudieron cargar los espacios');
      } finally {
        setLoadingEspacios(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (activeTab === 'archivos' && selectedEspacio?.id) {
      refreshArchivos(selectedEspacio.id);
    }
  }, [activeTab, selectedEspacio?.id]);

  const selectEspacio = async (e: Espacio) => {
    setSelectedEspacio(e);
    setSelectedConv(null);
    setMessages([]);
    setConvs([]);
    setErr(null);

    setLoadingConvs(true);
    try {
      const chats = await espaciosService.listChats(e.id);
      setConvs(chats);

      if (chats.length > 0) {
        await selectConv(e.id, chats[0]);
      }

      await refreshArchivos(e.id);
      setMobileEspaciosOpen(false);
    } catch (ex: any) {
      setErr(ex?.message ?? 'No se pudieron cargar los chats del espacio');
    } finally {
      setLoadingConvs(false);
    }
  };

  const selectConv = async (espacioId: string, conv: EspacioConversation) => {
    setSelectedConv(conv);
    setMessages([]);
    setErr(null);

    setLoadingHistory(true);
    try {
      const data: any = await espaciosService.getChat(espacioId, conv.id);

      const raw = safeArray<any>(data?.messages);
      const mapped = raw
        .map((m): UiMsg => ({
          role: m?.rol === 'assistant' ? 'assistant' : 'user',
          content: safeString(m?.contenido),
        }))
        .filter((m) => m.content.length > 0);

      setMessages(mapped);
      setMobileChatsOpen(false);
    } catch (ex: any) {
      setErr(ex?.message ?? 'No se pudo cargar el historial del chat');
    } finally {
      setLoadingHistory(false);
    }
  };

  const refreshArchivos = async (espacioId: string) => {
    setArchivosErr(null);
    setLoadingArchivos(true);
    try {
      const list = await espaciosService.listArchivos(espacioId);
      setArchivos(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setArchivosErr(e?.message ?? 'No se pudieron cargar los archivos');
    } finally {
      setLoadingArchivos(false);
    }
  };

  const handleDeleteArchivo = async (archivo: EspacioArchivo) => {
    if (!selectedEspacio) return;

    const ok = window.confirm(`¿Eliminar "${archivo.filename_original}" y todo su procesamiento asociado?`);
    if (!ok) return;

    setArchivoActionMsg(null);
    setArchivosErr(null);
    setDeletingFileId(archivo.id);

    try {
      const res = await espaciosService.deleteArchivo(selectedEspacio.id, archivo.id);

      if (!res?.ok) {
        throw new Error(res?.detail || 'No se pudo eliminar el archivo');
      }

      setArchivoActionMsg(`Archivo eliminado correctamente: ${archivo.filename_original}`);
      await refreshArchivos(selectedEspacio.id);

      if (activeTab === 'chat') {
        await refreshArchivos(selectedEspacio.id);
      }
    } catch (e: any) {
      setArchivosErr(e?.message ?? 'No se pudo eliminar el archivo');
    } finally {
      setDeletingFileId(null);
      window.setTimeout(() => setArchivoActionMsg(null), 4000);
    }
  };

  const handleNewChat = async () => {
    if (!selectedEspacio) return;
    setErr(null);
    setSending(false);
    setLoadingHistory(true);

    try {
      const created = await espaciosService.createChat(selectedEspacio.id, 'Chat de espacio');

      setConvs((prev) => [created, ...prev]);
      setSelectedConv(created);
      setMessages([]);
      setMobileChatsOpen(false);
    } catch (e: any) {
      setErr(e?.message ?? 'No se pudo crear un nuevo chat');
    } finally {
      setLoadingHistory(false);
    }
  };

  const upsertConvTitleInstant = (updated?: EspacioConversation) => {
    if (!updated) return;
    setConvs((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
    setSelectedConv((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
  };

  const handleSend = async () => {
    if (!selectedEspacio || !selectedConv) return;
    if (!input.trim() || sending) return;

    const content = input.trim();
    setInput('');
    setErr(null);

    setMessages((prev) => [...prev, { role: 'user', content }]);
    setSending(true);

    try {
      const res = await espaciosService.sendMessagePlus(selectedEspacio.id, selectedConv.id, content);

      upsertConvTitleInstant(res.conversation);

      setMessages((prev) => [
        ...prev,
        { role: res.assistant_message.rol, content: res.assistant_message.contenido },
      ]);
    } catch (e: any) {
      const msg = e?.message ?? 'Error enviando mensaje';
      setErr(msg);

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ ${msg}` },
      ]);
    } finally {
      setSending(false);
    }
  };

  // -----------------------------
  // Subir archivos
  // -----------------------------
  const [uploadProgressReal, setUploadProgressReal] = useState(0);   // progreso REAL
  const [uploadProgressUi, setUploadProgressUi] = useState(0);       // progreso SUAVIZADO (visual)
  const [uploadPhase, setUploadPhase] = useState<'idle'|'uploading'|'processing'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);

  const [processing, setProcessing] = useState(false);
  const [procPct, setProcPct] = useState(0);

  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  const [uploadError, setUploadError] = useState<string | null>(null);

  const procTimerRef = useRef<number | null>(null);


  const uploadMsgTimerRef = useRef<number | null>(null);

  // Limpia cualquier temporizador pendiente del mensaje de subida.
  const clearUploadMsgTimer = () => {
    if (uploadMsgTimerRef.current) {
      window.clearTimeout(uploadMsgTimerRef.current);
      uploadMsgTimerRef.current = null;
    }
  };

  // Programa el ocultamiento automático de mensajes de éxito o error.
  const scheduleUploadFeedbackClear = (delayMs: number = 5000) => {
    clearUploadMsgTimer();
    uploadMsgTimerRef.current = window.setTimeout(() => {
      setUploadMsg(null);
      setUploadError(null);
      resetUploadVisualState();
      uploadMsgTimerRef.current = null;
    }, delayMs);
  };

  // Oculta el estado visual de subida/procesamiento cuando el flujo ya terminó.
  const resetUploadVisualState = () => {
    setUploading(false);
    setProcessing(false);
    setUploadPct(0);
    setProcPct(0);
    stopProcAnim();
  };

  const stopProcAnim = () => {
    if (procTimerRef.current) {
      window.clearInterval(procTimerRef.current);
      procTimerRef.current = null;
    }
  };

  const startProcAnim = () => {
    stopProcAnim();
    setProcessing(true);
    setProcPct(2);

    procTimerRef.current = window.setInterval(() => {
      setProcPct((p) => {
        if (p >= 92) return 92;
        const next = p + Math.max(1, Math.round((92 - p) * 0.08));
        return Math.min(92, next);
      });
    }, 250);
  };

  useEffect(() => {
    return () => {
      stopProcAnim();
      clearUploadMsgTimer();
    };
  }, []);

  const openFilePicker = () => {
    clearUploadMsgTimer();
    setUploadMsg(null);
    setUploadError(null);
    fileInputRef.current?.click();
  };


  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || !selectedEspacio) return;

    const ext = getFileExtension(f.name);

    setUploadMsg(null);
    setUploadError(null);

    // Validación rápida en frontend: solo PDF y DOCX.
    if (!FRONT_ALLOWED_EXTENSIONS.includes(ext)) {
      setUploadError('Formato no permitido. Solo se admiten archivos PDF y DOCX.');
      scheduleUploadFeedbackClear(5000);
      return;
    }

    // Validación rápida en frontend: tamaño bruto máximo de 8 MB.
    if (f.size > FRONT_MAX_FILE_BYTES) {
      setUploadError('El archivo supera el tamaño máximo permitido de 8 MB.');
      scheduleUploadFeedbackClear(5000);
      return;
    }

    // reset visual
    setUploading(true);
    setUploadPct(0);
    setProcessing(false);
    setProcPct(0);
    stopProcAnim();

    try {
      const res = await (espaciosService as any).uploadArchivo(
        selectedEspacio.id,
        f,
        (pct: number) => {
          const clamped = Math.max(0, Math.min(100, Math.round(pct)));
          setUploadPct(clamped);

          if (clamped >= 100) {
            setUploading(false);
            setProcessing(true);
            startProcAnim();
            setUploadMsg('⏳ Archivo enviado. Procesando contenido...');
          }
        }
      );

      stopProcAnim();
      setUploading(false);
      setUploadPct(100);

      const rawRes: any = res;

      // Si backend responde ok:false, el archivo fue rechazado y no debe mostrarse como éxito.
      if (!rawRes?.ok) {
        setProcessing(false);
        setProcPct(0);
        setUploadMsg(null);
        setUploadError(rawRes?.detail ?? `No se pudo procesar "${f.name}".`);
        scheduleUploadFeedbackClear(6000);
        return;
      }

      setProcessing(false);
      setProcPct(100);
      setUploadError(null);

      const chunksInsertados =
        typeof rawRes?.chunks_insertados === 'number'
          ? rawRes.chunks_insertados
          : 0;

      setUploadMsg(`✅ "${f.name}" procesado correctamente. Chunks: ${chunksInsertados}`);
      scheduleUploadFeedbackClear(5000);

      await refreshArchivos(selectedEspacio.id);
    } catch (err: any) {
      const raw = (err?.message ?? '').toLowerCase();

      stopProcAnim();
      setUploading(false);

      if (raw.includes('timeout')) {
        setProcessing(true);
        setProcPct(92);
        setUploadPct(100);

        setUploadError(
          `El servidor tardó demasiado en responder para "${f.name}". ` +
          `Si el archivo era grande, revisa si el backend sigue procesándolo o vuelve a intentarlo con un archivo más pequeño.`
        );
        scheduleUploadFeedbackClear(7000);
        return;
      }

      setProcessing(false);
      setProcPct(0);
      setUploadPct(0);
      setUploadMsg(null);

      setUploadError(err?.message ?? `No se pudo subir "${f.name}".`);
      scheduleUploadFeedbackClear(6000);
    }
  };

  useEffect(() => {
    if (!uploading) return;

    const t = setInterval(() => {
      setUploadProgressUi((cur) => {
        const target = uploadProgressReal;

        if (cur < target) {
          const step = Math.max(1, Math.ceil((target - cur) * 0.2));
          return Math.min(target, cur + step);
        }

        return cur;
      });
    }, 50);

    return () => clearInterval(t);
  }, [uploading, uploadProgressReal]);

  const espacioTitle = useMemo(() => selectedEspacio?.nombre ?? 'Espacios', [selectedEspacio]);

  return (
    <div className="relative flex h-full min-h-0 bg-background">
      {(mobileEspaciosOpen || mobileChatsOpen) && (
        <button
          type="button"
          aria-label="Cerrar panel lateral"
          className="fixed inset-0 z-30 bg-black/65 lg:hidden"
          onClick={() => {
            setMobileEspaciosOpen(false);
            setMobileChatsOpen(false);
          }}
        />
      )}

      {/* Sidebar Espacios desktop */}
      {showEspaciosSidebar && (
        <div className="hidden lg:flex w-80 shrink-0 border-r border-border bg-card flex-col shadow-[inset_-1px_0_0_rgba(255,255,255,0.04)]">
          <EspaciosSidebarContent
            espacios={espacios}
            selectedEspacio={selectedEspacio}
            loadingEspacios={loadingEspacios}
            onOpenCreate={() => setOpenCreate(true)}
            onSelectEspacio={selectEspacio}
          />
        </div>
      )}

      {/* Sidebar Espacios móvil */}
      {showEspaciosSidebar && (
        <div
          className={`
            fixed inset-y-0 left-0 z-40 w-80 max-w-[88vw] border-r border-border bg-card
            transform transition-transform duration-300 ease-in-out lg:hidden shadow-2xl
            ${mobileEspaciosOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="flex h-full flex-col bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <div>
                <h2 className="font-bold text-base">Mis Espacios</h2>
                <p className="text-[11px] text-textSecondary mt-1">Selecciona un espacio de trabajo</p>
              </div>
              <button
                onClick={() => setMobileEspaciosOpen(false)}
                className="rounded-lg border border-border bg-white/5 px-2 py-1 text-sm hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-card">
              <EspaciosSidebarContent
                espacios={espacios}
                selectedEspacio={selectedEspacio}
                loadingEspacios={loadingEspacios}
                onOpenCreate={() => setOpenCreate(true)}
                onSelectEspacio={selectEspacio}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col bg-background relative">
        {!selectedEspacio ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
            <div className="p-6 sm:p-8 rounded-full bg-accent/5 mb-6">
              <IconGrid className="w-16 h-16 sm:w-24 sm:h-24 text-accent" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold">Panel de Espacios</h3>
            <p className="mt-2 text-sm sm:text-base text-textSecondary max-w-md">
              {espacios.length === 0 ? 'Crea un espacio para comenzar' : 'Selecciona un espacio para comenzar'}
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setOpenCreate(true)}
                className="px-6 py-3 text-sm bg-accent text-black rounded-xl hover:bg-white transition-all"
              >
                Crear espacio
              </button>

              <button
                onClick={() => setMobileEspaciosOpen(true)}
                className="lg:hidden px-6 py-3 text-sm border border-border rounded-xl hover:bg-white/5 transition-all"
              >
                Ver espacios
              </button>
            </div>
          </div>
        ) : (
          <>

            <header className="border-b border-border bg-card sticky top-0 z-10">
              <div className="px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
                        <IconGrid className="w-4 h-4" />
                      </div>
                      <h2 className="text-base sm:text-lg font-bold truncate">{espacioTitle}</h2>
                    </div>
                    <p className="text-[11px] sm:text-xs text-textSecondary mt-1 max-w-xl line-clamp-1">
                      Chat contextual basado únicamente en el material del espacio
                    </p>
                  </div>

                  <button
                    onClick={() => setShowTopPanel((s) => !s)}
                    className="shrink-0 rounded-lg border border-border bg-white/5 px-3 py-2 text-[11px] sm:text-xs font-medium hover:bg-white/10 transition-all"
                  >
                    {showTopPanel ? 'Ocultar herramientas' : 'Mostrar herramientas'}
                  </button>
                </div>

                {!showTopPanel && (
                  <div className="mt-3 flex gap-2 lg:hidden">
                    {showEspaciosSidebar && (
                      <button
                        onClick={() => setMobileEspaciosOpen(true)}
                        className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-white/5 transition-all shadow-sm"
                      >
                        Espacios
                      </button>
                    )}

                    {showChatsSidebar && (
                      <button
                        onClick={() => setMobileChatsOpen(true)}
                        className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-white/5 transition-all shadow-sm"
                      >
                        Chats
                      </button>
                    )}
                  </div>
                )}

                {showTopPanel && (
                  <div className="mt-4 space-y-4">
                    <div className="lg:hidden flex items-center gap-2">
                      {showEspaciosSidebar && (
                        <button
                          onClick={() => setMobileEspaciosOpen(true)}
                          className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-white/5 transition-all shadow-sm"
                        >
                          Espacios
                        </button>
                      )}

                      {showChatsSidebar && (
                        <button
                          onClick={() => setMobileChatsOpen(true)}
                          className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-white/5 transition-all shadow-sm"
                        >
                          Chats
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setShowEspaciosSidebar((s) => !s)}
                        className={`px-3 py-2 text-xs rounded-lg transition-all border ${
                          showEspaciosSidebar
                            ? 'border-border bg-card hover:bg-white/5'
                            : 'bg-accent text-black border-accent'
                        }`}
                      >
                        {showEspaciosSidebar ? 'Ocultar espacios' : 'Mostrar espacios'}
                      </button>

                      <button
                        onClick={() => setShowChatsSidebar((s) => !s)}
                        className={`px-3 py-2 text-xs rounded-lg transition-all border ${
                          showChatsSidebar
                            ? 'border-border bg-card hover:bg-white/5'
                            : 'bg-accent text-black border-accent'
                        }`}
                      >
                        {showChatsSidebar ? 'Ocultar chats' : 'Mostrar chats'}
                      </button>

                      <button
                        onClick={handleNewChat}
                        className="px-4 py-2 text-xs bg-accent/10 text-accent border border-accent/20 rounded-lg hover:bg-accent/20 transition-all"
                      >
                        Nuevo chat
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setActiveTab('chat')}
                        className={`px-4 py-2 text-xs rounded-lg transition-all ${
                          activeTab === 'chat'
                            ? 'bg-accent text-black'
                            : 'bg-background border border-border hover:bg-white/5'
                        }`}
                      >
                        Chat
                      </button>

                      <button
                        onClick={() => setActiveTab('archivos')}
                        className={`px-4 py-2 text-xs rounded-lg transition-all ${
                          activeTab === 'archivos'
                            ? 'bg-accent text-black'
                            : 'bg-background border border-border hover:bg-white/5'
                        }`}
                      >
                        Archivos
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </header>

            {showTopPanel && (
              <div className="px-4 py-3 sm:px-6 border-b border-border bg-background/40">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-textPrimary">
                      Base de conocimiento del espacio
                    </div>
                    <div className="text-[13px] text-textSecondary mt-1">
                      Sube material necesario en PDF o DOCX. Límite máximo: 8 MB por archivo. 
                      Se recomienda contenido con texto real, no escaneado ni basado principalmente en imágenes.
                    </div>
                  </div>

                  <div className="w-full lg:w-auto lg:min-w-[320px]">
                    <button
                      onClick={openFilePicker}
                      disabled={!selectedEspacio || uploading || processing}
                      className="w-full lg:w-auto px-4 py-2.5 text-xs bg-accent/10 text-accent border border-accent/20 rounded-lg hover:bg-accent/20 transition-all disabled:opacity-50"
                    >
                      Subir archivo PDF o DOCX
                    </button>

                    {(uploading || uploadPct > 0) && (
                      <div className="text-[11px] text-textSecondary mt-2">
                        <div className="flex justify-between mb-1 gap-2">
                          <span>Subiendo</span>
                          <span>{uploadPct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-black border border-border overflow-hidden">
                          <div className="h-full bg-accent transition-all" style={{ width: `${uploadPct}%` }} />
                        </div>
                      </div>
                    )}

                    {processing && (
                      <div className="text-[11px] text-textSecondary mt-2">
                        <div className="flex justify-between mb-1 gap-2">
                          <span>Procesando</span>
                          <span>{procPct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-black/20 border border-border overflow-hidden">
                          <div className="h-full bg-accent transition-all" style={{ width: `${procPct}%` }} />
                        </div>
                        <div className="mt-1 opacity-70">
                          Esto depende del tamaño del archivo y del análisis interno (texto, chunks y embeddings).
                        </div>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx"
                      className="hidden"
                      onChange={onPickFile}
                    />
                  </div>
                </div>
              </div>
            )}

            {err && (
              <div className="px-4 sm:px-6 py-3 text-sm text-red-400 border-b border-border bg-red-500/5">
                {err}
              </div>
            )}

            {uploadError && (
              <div className="px-4 sm:px-6 py-4 border-b border-border">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <div className="text-red-400 text-lg">✕</div>
                  <div className="text-sm text-red-300 font-medium whitespace-pre-wrap">
                    {uploadError}
                  </div>
                </div>
              </div>
            )}

            {uploadMsg && (
              <div className="px-4 sm:px-6 py-4 border-b border-border">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <div className="text-emerald-400 text-lg">✔</div>
                  <div className="text-sm text-emerald-300 font-medium whitespace-pre-wrap">
                    {uploadMsg}
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 flex min-h-0 overflow-hidden">
              {/* Sidebar conversaciones desktop */}
              {showChatsSidebar && (
                <div className="hidden lg:flex w-80 shrink-0 border-r border-border bg-card flex-col shadow-[inset_-1px_0_0_rgba(255,255,255,0.04)]">
                  <ChatsSidebarContent
                    convs={convs}
                    selectedConv={selectedConv}
                    selectedEspacio={selectedEspacio}
                    loadingConvs={loadingConvs}
                    onNewChat={handleNewChat}
                    onSelectConv={selectConv}
                  />
                </div>
              )}

              {/* Sidebar conversaciones móvil */}
              {showChatsSidebar && (
                <div
                  className={`
                    fixed inset-y-0 left-0 z-40 w-80 max-w-[88vw] border-r border-border bg-card
                    transform transition-transform duration-300 ease-in-out lg:hidden shadow-2xl
                    ${mobileChatsOpen ? 'translate-x-0' : '-translate-x-full'}
                  `}
                >
                  <div className="flex h-full flex-col bg-card">
                    <div className="flex items-center justify-between border-b border-border px-4 py-4">
                      <div>
                        <h3 className="text-sm font-bold flex items-center gap-2">
                          <IconChat className="w-4 h-4 text-accent" />
                          Chats del espacio
                        </h3>
                        <p className="text-[11px] text-textSecondary mt-1">Historial del espacio actual</p>
                      </div>
                      <button
                        onClick={() => setMobileChatsOpen(false)}
                        className="rounded-lg border border-border bg-white/5 px-2 py-1 text-sm hover:bg-white/10 transition-colors"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-card">
                      <ChatsSidebarContent
                        convs={convs}
                        selectedConv={selectedConv}
                        selectedEspacio={selectedEspacio}
                        loadingConvs={loadingConvs}
                        onNewChat={handleNewChat}
                        onSelectConv={selectConv}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Chat */}
              <div className="flex min-w-0 flex-1 flex-col bg-background">
                {activeTab === 'chat' && (
                  <div
                    ref={scrollRef}
                    className="flex-1 min-h-0 overflow-y-auto px-3 py-4 sm:px-4 sm:py-5 lg:px-6"
                  >
                    {loadingHistory ? (
                      <div className="h-full flex items-center justify-center opacity-60 text-sm sm:text-base">
                        Cargando historial...
                      </div>
                    ) : !selectedConv ? (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-50 px-4">
                        <div className="mb-4 rounded-full bg-accent/5 p-4">
                          <IconChat className="w-12 h-12 sm:w-14 sm:h-14 text-accent" />
                        </div>
                        <p className="text-base sm:text-lg font-medium">Elige o crea un chat para comenzar</p>
                        <p className="text-xs sm:text-sm text-textSecondary mt-2 max-w-md">
                          Cada chat dentro del espacio mantiene el contexto del material subido a ese espacio.
                        </p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-50 px-4">
                        <div className="mb-4 rounded-full bg-accent/5 p-4">
                          <IconChat className="w-12 h-12 sm:w-14 sm:h-14 text-accent" />
                        </div>
                        <p className="text-base sm:text-lg font-medium">Inicia una conversación en este espacio</p>
                        <p className="text-xs sm:text-sm text-textSecondary mt-2 max-w-md">
                          Puedes preguntar sobre el contenido cargado, resumirlo o pedir materiales derivados.
                        </p>
                      </div>
                    ) : (
                      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
                        {messages.map((m, i) => (
                          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`w-fit max-w-[92%] sm:max-w-[88%] lg:max-w-[85%] rounded-2xl px-4 py-3 sm:px-5 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                                m.role === 'user'
                                  ? 'bg-accent text-black rounded-tr-none'
                                  : 'bg-card border border-border rounded-tl-none'
                              }`}
                            >
                              {m.content}
                            </div>
                          </div>
                        ))}

                        {sending && (
                          <div className="flex justify-start">
                            <div className="bg-card border border-border rounded-2xl rounded-tl-none px-4 py-3 sm:px-5 animate-pulse shadow-sm">
                              <div className="flex gap-2">
                                <div className="w-2 h-2 bg-textSecondary rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-textSecondary rounded-full animate-bounce [animation-delay:0.2s]" />
                                <div className="w-2 h-2 bg-textSecondary rounded-full animate-bounce [animation-delay:0.4s]" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'archivos' && (
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
                    <div className="max-w-5xl mx-auto">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold">Archivos del espacio</h3>
                          <p className="text-xs text-textSecondary mt-1 leading-relaxed">
                            Aquí se muestran los archivos registrados del espacio y su estado de procesamiento.
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {/*<button
                            onClick={() => setShowArchivosPanel((s) => !s)}
                            className="px-3 py-2 text-xs rounded-lg border border-border hover:bg-white/5 transition-all"
                          >
                            {showArchivosPanel ? 'Ocultar apartado' : 'Mostrar apartado'}
                          </button>*/}

                          <button
                            onClick={() => selectedEspacio?.id && refreshArchivos(selectedEspacio.id)}
                            className="px-3 py-2 text-xs rounded-lg border border-border hover:bg-white/5 transition-all"
                            disabled={loadingArchivos}
                          >
                            {loadingArchivos ? 'Actualizando...' : 'Actualizar'}
                          </button>
                        </div>
                      </div>

                      {showArchivosPanel && (
                        <div className="rounded-2xl border border-border bg-card/40 overflow-hidden">
                          {archivoActionMsg && (
                            <div className="px-4 py-3 border-b border-border bg-emerald-500/10 text-emerald-300 text-sm">
                              {archivoActionMsg}
                            </div>
                          )}

                          {archivosErr && (
                            <div className="px-4 py-3 border-b border-border bg-red-500/10 text-red-300 text-sm">
                              {archivosErr}
                            </div>
                          )}

                          {loadingArchivos ? (
                            <div className="p-5 text-sm opacity-60">Cargando archivos...</div>
                          ) : archivos.length === 0 ? (
                            <div className="p-5 text-sm text-textSecondary">
                              Aún no hay archivos registrados en este espacio.
                            </div>
                          ) : (
                            <div className="divide-y divide-border">
                              {archivos.map((a) => {
                                const isDeleting = deletingFileId === a.id;

                                return (
                                  <div
                                    key={a.id}
                                    className="p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <div className="text-sm font-semibold break-words">
                                          {a.filename_original}
                                        </div>

                                        <span
                                          className={`px-2 py-1 rounded-md text-[10px] font-semibold border ${
                                            a.estado === 'processed'
                                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                              : a.estado === 'failed'
                                              ? 'border-red-500/30 bg-red-500/10 text-red-300'
                                              : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300'
                                          }`}
                                        >
                                          {a.estado === 'processed'
                                            ? 'Procesado'
                                            : a.estado === 'failed'
                                            ? 'Fallido'
                                            : 'Procesando'}
                                        </span>
                                      </div>

                                      <div className="mt-2 flex flex-col gap-1 text-[11px] text-textSecondary sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3">
                                        <span>{a.mime_type || 'archivo'}</span>
                                        <span>{formatBytes(a.size_bytes || 0)}</span>
                                        <span>Chunks: {typeof a.total_chunks === 'number' ? a.total_chunks : 0}</span>
                                        {a.created_at && (
                                          <span>{new Date(a.created_at).toLocaleString()}</span>
                                        )}
                                      </div>

                                      {a.error_detail && (
                                        <div className="mt-2 text-xs text-red-300 break-words">
                                          {a.error_detail}
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                                      <button
                                        className="w-full sm:w-auto px-3 py-2 text-xs rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10 disabled:opacity-50 transition-all"
                                        onClick={() => handleDeleteArchivo(a)}
                                        disabled={isDeleting}
                                      >
                                        {isDeleting ? 'Eliminando...' : 'Eliminar'}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div className="px-4 py-3 border-t border-border text-[11px] text-textSecondary opacity-80">
                            Eliminar un archivo también borra sus embeddings, inferencias y etiquetas asociadas.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="border-t border-border bg-card px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
                  <div className="max-w-4xl mx-auto">
                    <div className="relative">
                      <textarea
                        ref={textareaRef}
                        className="min-h-[56px] max-h-40 w-full resize-none overflow-y-auto bg-card border border-border rounded-2xl px-4 py-3 pr-14 text-sm leading-relaxed focus:outline-none focus:border-accent shadow-lg"
                        placeholder={
                          selectedConv ? `Pregunta algo sobre ${selectedEspacio.nombre}...` : 'Selecciona un chat...'
                        }
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        /*onKeyDown={(e) => e.key === 'Enter' && handleSend()}*/
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && !(e.nativeEvent as any).isComposing) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        disabled={!selectedConv || loadingHistory}
                        rows={1}
                      />

                      <button
                        onClick={handleSend}
                        disabled={!selectedConv || loadingHistory || sending || !input.trim()}
                        className="absolute right-2 bottom-2 p-2.5 bg-accent hover:bg-blue-600 rounded-xl transition-all disabled:opacity-50 shadow-sm"
                      >
                        <IconSend className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </button>
                    </div>
                    <p className="mt-2 px-1 text-[11px] text-textSecondary">
                      Enter para enviar · Shift + Enter para salto de línea
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Crear Espacio */}
      {openCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-5 border-b border-border flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-base sm:text-lg">Crear espacio</h3>
                <p className="text-xs text-textSecondary">Define el contexto (nivel/grado/materia) del espacio.</p>
              </div>
              <button
                onClick={() => {
                  if (!creating) setOpenCreate(false);
                }}
                className="text-textSecondary hover:text-textPrimary"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3">
              <Field label="Nombre" value={form.nombre} onChange={(v) => setForm((s) => ({ ...s, nombre: v }))} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Nivel" value={form.nivel} onChange={(v) => setForm((s) => ({ ...s, nivel: v }))} />
                <Field label="Grado" value={form.grado} onChange={(v) => setForm((s) => ({ ...s, grado: v }))} />
              </div>
              <Field label="Materia" value={form.materia} onChange={(v) => setForm((s) => ({ ...s, materia: v }))} />
              <Field
                label="Descripción (opcional)"
                value={form.descripcion}
                onChange={(v) => setForm((s) => ({ ...s, descripcion: v }))}
                textarea
              />

              {err && <div className="text-sm text-red-400">{err}</div>}
            </div>

            <div className="p-4 sm:p-5 border-t border-border flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button
                onClick={() => {
                  if (!creating) {
                    setOpenCreate(false);
                    resetForm();
                    setErr(null);
                  }
                }}
                className="w-full sm:w-auto px-4 py-2 text-xs rounded-lg border border-border hover:bg-white/50 transition-all"
                disabled={creating}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateEspacio}
                className="w-full sm:w-auto px-4 py-2 text-xs rounded-lg bg-accent text-black hover:bg-white transition-all disabled:opacity-50"
                disabled={creating}
              >
                {creating ? 'Creando...' : 'Crear espacio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function EspaciosSidebarContent(props: {
  espacios: Espacio[];
  selectedEspacio: Espacio | null;
  loadingEspacios: boolean;
  onOpenCreate: () => void;
  onSelectEspacio: (e: Espacio) => void;
}) {
  const { espacios, selectedEspacio, loadingEspacios, onOpenCreate, onSelectEspacio } = props;

  return (
    <div className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-base sm:text-lg">Mis Espacios</h2>
          <p className="text-[11px] text-textSecondary mt-1">Organiza tu contexto por materia y grado</p>
        </div>
        <button
          onClick={onOpenCreate}
          className="p-2 rounded-lg border border-accent/20 bg-accent/10 text-accent hover:bg-accent/20 transition-all"
          title="Crear espacio"
        >
          <IconPlus className="w-5 h-5" />
        </button>
      </div>

      {loadingEspacios ? (
        <div className="mt-6 opacity-60 text-sm">Cargando espacios...</div>
      ) : espacios.length === 0 ? (
        <div className="mt-6 p-4 rounded-2xl border border-border bg-background/60">
          <div className="text-sm font-semibold">Aún no tienes espacios</div>
          <div className="text-xs text-textSecondary mt-1 leading-relaxed">
            Crea uno para iniciar tu chat contextual y subir material.
          </div>
          <button
            onClick={onOpenCreate}
            className="mt-4 w-full px-4 py-2.5 text-xs bg-accent text-black rounded-lg hover:bg-blue-600 transition-all"
          >
            Crear mi primer espacio
          </button>
        </div>
      ) : (
        <div className="space-y-3 mt-6">
          {espacios.map((e) => (
            <button
              key={e.id}
              onClick={() => onSelectEspacio(e)}
              className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 ${
                selectedEspacio?.id === e.id
                  ? 'bg-accent/10 border-accent/40 ring-1 ring-accent/40'
                  : 'bg-background/60 border-border hover:bg-white/5 hover:border-textSecondary/30'
              }`}
            >
              <h4 className="font-semibold text-sm break-words">{e.nombre}</h4>
              <p className="text-xs text-textSecondary mt-1 line-clamp-2">
                {e.materia} • {e.nivel} {e.grado}
              </p>
              {e.descripcion && (
                <p className="text-[11px] text-textSecondary mt-1 line-clamp-2 leading-relaxed">
                  {e.descripcion}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatsSidebarContent(props: {
  convs: EspacioConversation[];
  selectedConv: EspacioConversation | null;
  selectedEspacio: Espacio | null;
  loadingConvs: boolean;
  onNewChat: () => void;
  onSelectConv: (espacioId: string, conv: EspacioConversation) => void;
}) {
  const { convs, selectedConv, selectedEspacio, loadingConvs, onNewChat, onSelectConv } = props;

  return (
    <div className="p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold flex items-center gap-2">
            <IconChat className="w-4 h-4 text-accent" />
            Chats del espacio
          </h3>
          <p className="text-[11px] text-textSecondary mt-1">Conversaciones asociadas al espacio actual</p>
        </div>
        <button
          onClick={onNewChat}
          className="p-2 hover:bg-white/5 rounded-lg text-accent transition-colors"
          title="Nuevo chat"
        >
          <IconPlus className="w-5 h-5" />
        </button>
      </div>

      {loadingConvs ? (
        <div className="pt-4 opacity-60 text-sm">Cargando chats...</div>
      ) : convs.length === 0 ? (
        <div className="pt-4 opacity-60 text-sm leading-relaxed">
          No hay chats aún. Crea uno con “Nuevo chat”.
        </div>
      ) : (
        <div className="pt-4 space-y-2">
          {convs.map((c) => {
            const title = (c.titulo || 'Chat de espacio').trim();
            return (
              <button
                key={c.id}
                onClick={() => selectedEspacio && onSelectConv(selectedEspacio.id, c)}
                className={`w-full text-left p-3 rounded-2xl border transition-all ${
                  selectedConv?.id === c.id
                    ? 'bg-accent/10 border-accent/40 ring-1 ring-accent/40'
                    : 'bg-background/60 border-border hover:bg-white/5 hover:border-textSecondary/30'
                }`}
              >
                <div className="text-sm font-semibold line-clamp-2 break-words">{title}</div>
                <div className="text-[11px] text-textSecondary mt-1 line-clamp-1">
                  {new Date(c.created_at).toLocaleString()}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  const { label, value, onChange, textarea } = props;
  return (
    <label className="block">
      <div className="text-xs text-textSecondary mb-1">{label}</div>
      {textarea ? (
        <textarea
          className="w-full min-h-[90px] bg-black/10 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="w-full bg-black/10 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

function formatBytes(bytes: number) {
  if (!bytes || bytes < 1) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let b = bytes;
  let i = 0;
  while (b >= 1024 && i < units.length - 1) {
    b /= 1024;
    i++;
  }
  return `${b.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}



export default EspaciosSection;