import React, { useEffect, useMemo, useRef, useState } from 'react';
import { espaciosService } from '../../services/espaciosService';
import type { Espacio, EspacioConversation, EspacioMessageApi } from '../../types';
import { IconPlus, IconSend, IconGrid, IconChat } from '../../shared/components/Icons';

type UiMsg = { role: 'user' | 'assistant'; content: string };



type EspacioArchivo = {
  id: string;
  filename_original: string;
  mime_type: string;
  size_bytes?: number | null;
  deleted_at?: string | null;
  created_at?: string;
};

const safeArray = <T,>(v: any): T[] => (Array.isArray(v) ? v : []);
const safeString = (v: any): string => (typeof v === 'string' ? v : (v == null ? '' : String(v)));




type CreateEspacioForm = {
  nombre: string;
  nivel: string;
  grado: string;
  materia: string;
  descripcion: string;
};




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

  // Layout UI states
  const [showChatsSidebar, setShowChatsSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'archivos'>('chat');

  const [showEspaciosSidebar, setShowEspaciosSidebar] = useState(true);

  // NUEVO ESTADO PARA ARCHIVOS  
  const [loadingArchivos, setLoadingArchivos] = useState(false);
  const [archivosErr, setArchivosErr] = useState<string | null>(null);
  const [archivos, setArchivos] = useState<EspacioArchivo[]>([]);

  // ✅ para ocultar/mostrar el apartado dentro de la tab Archivos
  const [showArchivosPanel, setShowArchivosPanel] = useState(true);


  // autoscroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

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

      // refresca lista y selecciona el nuevo espacio
      const list = await refreshEspacios();
      const nuevo = list.find((x) => x.id === created.id) || (created as any);

      setOpenCreate(false);
      resetForm();

      // autoselect + cargar chats
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


    useEffect(() => {
      if (activeTab === 'archivos' && selectedEspacio?.id) {
        refreshArchivos(selectedEspacio.id);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // autoselect último si existe
      if (chats.length > 0) {
        await selectConv(e.id, chats[0]);
      }
            // ✅ cargar archivos del espacio
      await refreshArchivos(e.id);
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
      /*const data = await espaciosService.getChat(espacioId, conv.id);
      const mapped: UiMsg[] = (data.messages || []).map((m: EspacioMessageApi) => ({
        role: m.rol,
        content: m.contenido,
      }));
      setMessages(mapped);*/
      const data: any = await espaciosService.getChat(espacioId, conv.id);

      const raw = safeArray<any>(data?.messages);
      const mapped = raw
        .map((m): UiMsg => ({
          role: m?.rol === 'assistant' ? 'assistant' : 'user',
          content: safeString(m?.contenido),
        }))
        .filter((m) => m.content.length > 0);


      setMessages(mapped);

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
      const list = await (espaciosService as any).listArchivos(espacioId);
      const alive = (list || []).filter((x: any) => !x.deleted_at);
      setArchivos(alive);
    } catch (e: any) {
      setArchivosErr(e?.message ?? 'No se pudieron cargar los archivos');
    } finally {
      setLoadingArchivos(false);
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
    /*} catch (e: any) {
      setErr(e?.message ?? 'Error enviando mensaje');
    } finally {
      setSending(false);
    }*/
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
  /*const [uploading, setUploading] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);

  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);*/
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

const procTimerRef = useRef<number | null>(null);

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

  // Animación suave: llega hasta 92% y se queda “esperando”
  procTimerRef.current = window.setInterval(() => {
    setProcPct((p) => {
      if (p >= 92) return 92;
      const next = p + Math.max(1, Math.round((92 - p) * 0.08));
      return Math.min(92, next);
    });
  }, 250);
};

useEffect(() => {
  return () => stopProcAnim(); // cleanup al desmontar
}, []);


  const openFilePicker = () => {
    setUploadMsg(null);
    fileInputRef.current?.click();
  };

  

  /*const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || !selectedEspacio) return;

    setUploading(true);
    setUploadMsg(null);
    try {
      const res = await espaciosService.uploadArchivo(selectedEspacio.id, f);
      setUploadMsg(`✅ "${f.name}" cargado. Chunks: ${res.chunks_insertados}`);
    } catch (err: any) {
      setUploadMsg(`❌ ${err?.message ?? 'Error subiendo archivo'}`);
    } finally {
      setUploading(false);
    }
  };*/
  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || !selectedEspacio) return;

    setUploadMsg(null);

    // reset visual
    setUploading(true);
    setUploadPct(0);
    setProcessing(false);
    setProcPct(0);
    stopProcAnim();

    try {
      // ✅ IMPORTANTE:
      // aquí asumimos que tu upload ya emite progreso real (porque dijiste que ya lo viste contar).
      // Solo conectamos ese % a la barra.
      const res = await (espaciosService as any).uploadArchivo(
        selectedEspacio.id,
        f,
        (pct: number) => {
          const clamped = Math.max(0, Math.min(100, Math.round(pct)));
          setUploadPct(clamped);

          // cuando termina la subida, pasamos a “Procesando”
          if (clamped >= 100 && !processing) {
            setUploading(false);
            startProcAnim();
            setUploadMsg(`⏳ Archivo subido. Procesando contenido... (puede tardar si es grande)`);
          }
        }
      );

      // fin OK
      stopProcAnim();
      setProcessing(false);
      setProcPct(100);
      setUploading(false);
      setUploadPct(100);

      setUploadMsg(`✅ "${f.name}" subido correctamente. Chunks: ${res.chunks_insertados}`);

            // ✅ refrescar listado de archivos
      await refreshArchivos(selectedEspacio.id);

    } catch (err: any) {
      // Si cae aquí por “timeout” pero el backend sigue, NO lo trates como error fatal.
      const raw = (err?.message ?? '').toLowerCase();

      stopProcAnim();
      setUploading(false);

      if (raw.includes('timeout')) {
        setProcessing(true);
        setProcPct(92); // se queda como “en proceso”
        setUploadPct(100);
        setUploadMsg(
          `⏳ "${f.name}" fue enviado. El servidor tardó en responder (archivo grande).\n` +
          `Es normal: puede seguir procesando en segundo plano. Revisa en 1–3 min si ya aparece el contenido.`
        );
        return;
      }

      setProcessing(false);
      setProcPct(0);
      setUploadPct(0);

      setUploadMsg(`❌ No se pudo subir "${f.name}". ${err?.message ?? 'Error'}`);
    }
  };



  useEffect(() => {
    if (!uploading) return;

    const t = setInterval(() => {
      setUploadProgressUi((cur) => {
        const target = uploadProgressReal;

        // subir “suave” hacia el target
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
    <div className="flex h-full">
      {/* Sidebar Espacios */}
      {showEspaciosSidebar && (

        <div className="w-80 bg-sidebar text-textLight border-r border-borderDark">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Mis Espacios</h2>
              <button
                onClick={() => setOpenCreate(true)}
                className="p-2 rounded-lg border border-accent/20 bg-accent/10 text-accent hover:bg-accent/20 transition-all"
                title="Crear espacio"
              >
                <IconPlus className="w-5 h-5" />
              </button>
            </div>

            {loadingEspacios ? (
              <div className="mt-6 opacity-60 text-sm">Cargando espacios...</div>
            ) : espacios.length === 0 ? (
              <div className="mt-6 p-4 rounded-xl border border-border bg-card">
                <div className="text-sm font-semibold">Aún no tienes espacios</div>
                <div className="text-xs text-textSecondary mt-1">
                  Crea uno para iniciar tu chat contextual y subir material.
                </div>
                <button
                  onClick={() => setOpenCreate(true)}
                  className="mt-4 w-full px-4 py-2 text-xs bg-accent text-black rounded-lg hover:bg-blue-600 transition-all"
                >
                  Crear mi primer espacio
                </button>
              </div>
            ) : (
              <div className="space-y-3 mt-6">
                {espacios.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => selectEspacio(e)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                      selectedEspacio?.id === e.id
                        ? 'bg-accent/10 border-accent/40 ring-1 ring-accent/40'
                        : 'bg-card border-border hover:bg-white/5 hover:border-textSecondary/30'
                    }`}
                  >
                    <h4 className="font-semibold text-sm">{e.nombre}</h4>
                    <p className="text-xs text-textSecondary mt-1 line-clamp-1">
                      {e.materia} • {e.nivel} {e.grado}
                    </p>
                    {e.descripcion && (
                      <p className="text-[11px] text-textSecondary mt-1 line-clamp-1">{e.descripcion}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Main */}
      <div className="flex-1 flex flex-col bg-background/50 relative">
        
        {!selectedEspacio ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-100">
            <div className="p-8 rounded-full bg-accent/5 mb-6">
              <IconGrid className="w-24 h-24 text-accent" />
            </div>
            <h3 className="text-xl font-bold">Panel de Espacios</h3>
            <p className="mt-2 text-textSecondary">
              {espacios.length === 0 ? 'Crea un espacio para comenzar' : 'Selecciona un espacio para comenzar'}
            </p>

            <button
              onClick={() => setOpenCreate(true)}
              className="mt-6 px-6 py-3 text-sm bg-accent text-black rounded-xl hover:bg-white transition-all"
            >
              Crear espacio
            </button>
          </div>
        ) : (
          <>




            
            <header className="p-6 border-b border-border bg-card/100 backdrop-blur-md">
              {/* Top row */}
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold truncate">{espacioTitle}</h2>
                  <p className="text-xs text-textSecondary mt-1">
                    Chat contextual basado únicamente en el material del espacio
                  </p>
                </div>

                {/* Actions + Upload (TU BLOQUE) */}
                <div className="flex gap-2 items-start">
                  <button
                    onClick={() => setShowEspaciosSidebar((s) => !s)}
                    className={`px-3 py-2 text-xs rounded-lg transition-all border ${
                      showEspaciosSidebar
                        ? 'border-border hover:bg-white/5'
                        : 'bg-accent text-black border-accent'
                    }`}
                  >
                    {showEspaciosSidebar ? 'Ocultar espacios' : 'Mostrar espacios'}
                  </button>


                  <button
                    onClick={() => setShowChatsSidebar((s) => !s)}
                    className={`px-3 py-2 text-xs rounded-lg transition-all border ${
                      showChatsSidebar
                        ? 'border-border hover:bg-white/5'
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

                  {/* ✅ TU UPLOAD: botón + barras + input file */}
                  <div className="flex flex-col gap-2 min-w-[260px]">
                    <button
                      onClick={openFilePicker}
                      disabled={!selectedEspacio || uploading || processing}
                      className="px-4 py-2 text-xs bg-accent/10 text-accent border border-accent/20 rounded-lg hover:bg-accent/20 transition-all disabled:opacity-50"
                    >
                      Subir Base de Conocimiento
                    </button>

                    {/* Barra 1: Subida */}
                    {(uploading || uploadPct > 0) && (
                      <div className="text-[11px] text-textSecondary">
                        <div className="flex justify-between mb-1">
                          <span>Subiendo</span>
                          <span>{uploadPct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-black border border-border overflow-hidden">
                          <div className="h-full bg-accent transition-all" style={{ width: `${uploadPct}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Barra 2: Procesamiento */}
                    {processing && (
                      <div className="text-[11px] text-textSecondary">
                        <div className="flex justify-between mb-1">
                          <span>Procesando</span>
                          <span>{procPct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-black/20 border border-border overflow-hidden">
                          <div className="h-full bg-accent transition-all" style={{ width: `${procPct}%` }} />
                        </div>
                        <div className="mt-1 opacity-70">
                          Esto depende del tamaño del PDF y del análisis (chunks/embeddings).
                        </div>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.txt,.docx"
                      className="hidden"
                      onChange={onPickFile}
                    />
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-4 py-2 text-xs rounded-lg transition-all ${
                    activeTab === 'chat'
                      ? 'bg-accent text-black'
                      : 'bg-black/20 border border-border hover:bg-white/5'
                  }`}
                >
                  Chat
                </button>

                {/*
                <button
                  onClick={() => setActiveTab('archivos')}
                  className={`px-4 py-2 text-xs rounded-lg transition-all ${
                    activeTab === 'archivos'
                      ? 'bg-accent text-black'
                      : 'bg-black/20 border border-border hover:bg-white/5'
                  }`}
                >
                  Archivos
                </button>
                */}
                              </div>
            </header>



            {err && <div className="px-6 py-3 text-sm text-red-400 border-b border-border">{err}</div>}
              {uploadMsg && (
                <div className="px-6 py-4 border-b border-border">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <div className="text-emerald-400 text-lg">✔</div>
                    <div className="text-sm text-emerald-300 font-medium">
                      {uploadMsg}
                    </div>
                  </div>
                </div>
              )}

            

            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar Conversaciones del espacio */}



              {showChatsSidebar && (
                <div className="w-80 border-r border-border bg-sidebar text-textLight border-r border-borderDark
">

                <div className="p-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <IconChat className="w-4 h-4 text-accent" />
                    Chats del espacio
                  </h3>
                  <button
                    onClick={handleNewChat}
                    className="p-2 hover:bg-white/5 rounded-lg text-accent transition-colors"
                    title="Nuevo chat"
                  >
                    <IconPlus className="w-5 h-5" />
                  </button>
                </div>

                {loadingConvs ? (
                  <div className="px-4 pb-4 opacity-60 text-sm">Cargando chats...</div>
                ) : convs.length === 0 ? (
                  <div className="px-4 pb-4 opacity-60 text-sm">
                    No hay chats aún. Crea uno con “Nuevo chat”.
                  </div>
                ) : (
                  <div className="px-3 pb-4 space-y-2">
                    {convs.map((c) => {
                      const title = (c.titulo || 'Chat de espacio').trim();
                      return (
                        <button
                          key={c.id}
                          onClick={() => selectConv(selectedEspacio.id, c)}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${
                            selectedConv?.id === c.id
                              ? 'bg-accent/10 border-accent/40 ring-1 ring-accent/40'
                              : 'bg-card border-border hover:bg-white/5 hover:border-textSecondary/30'
                          }`}
                        >
                          <div className="text-sm font-semibold line-clamp-1">{title}</div>
                          <div className="text-[11px] text-textSecondary mt-1 line-clamp-1">
                            {new Date(c.created_at).toLocaleString()}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                </div>
          )}


              {/* Chat */}
              <div className="flex-1 flex flex-col transition-all">
              {activeTab === 'chat' && (
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                  {loadingHistory ? (
                    <div className="h-full flex items-center justify-center opacity-60">Cargando historial...</div>
                  ) : !selectedConv ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                      <IconChat className="w-16 h-16 mb-4" />
                      <p className="text-lg">Elige o crea un chat para comenzar</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                      <IconChat className="w-16 h-16 mb-4" />
                      <p className="text-lg">Inicia una conversación en este espacio</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
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
                          <div className="bg-card border border-border rounded-2xl rounded-tl-none px-5 py-3 animate-pulse">
                            <div className="flex gap-2">
                              <div className="w-2 h-2 bg-textSecondary rounded-full animate-bounce" />
                              <div className="w-2 h-2 bg-textSecondary rounded-full animate-bounce [animation-delay:0.2s]" />
                              <div className="w-2 h-2 bg-textSecondary rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  </div>
                )}


                {/*
                {activeTab === 'archivos' && (
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-4xl mx-auto">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">Archivos del espacio</h3>
                          <p className="text-xs text-textSecondary mt-1">
                            Estos archivos se guardan en Storage y el chat usa sus embeddings (se filtran eliminados).
                          </p>
                        </div>

                        <button
                          onClick={() => setShowArchivosPanel((s) => !s)}
                          className="px-3 py-2 text-xs rounded-lg border border-border hover:bg-white/5 transition-all"
                        >
                          {showArchivosPanel ? 'Ocultar apartado' : 'Mostrar apartado'}
                        </button>
                      </div>

                      {showArchivosPanel && (
                        <div className="p-5 border border-border rounded-2xl bg-card/40">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-semibold">Listado</div>
                            <button
                              onClick={() => selectedEspacio?.id && refreshArchivos(selectedEspacio.id)}
                              className="px-3 py-2 text-xs rounded-lg border border-border hover:bg-white/5"
                              disabled={loadingArchivos}
                            >
                              {loadingArchivos ? 'Actualizando...' : 'Actualizar'}
                            </button>
                          </div>

                          {archivosErr && (
                            <div className="mb-3 text-sm text-red-400">{archivosErr}</div>
                          )}

                          {loadingArchivos ? (
                            <div className="text-sm opacity-60">Cargando archivos...</div>
                          ) : archivos.length === 0 ? (
                            <div className="text-sm text-textSecondary">
                              Aún no hay archivos subidos en este espacio.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {archivos.map((a) => (
                                <div
                                  key={a.id}
                                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card"
                                >
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold truncate">{a.filename_original}</div>
                                    <div className="text-[11px] text-textSecondary mt-1">
                                      {a.mime_type || 'archivo'} • {formatBytes(a.size_bytes || 0)}
                                      {a.created_at ? ` • ${new Date(a.created_at).toLocaleString()}` : ''}
                                    </div>
                                  </div>

                                  <div className="flex gap-2 shrink-0">
                                    <button
                                      className="px-3 py-2 text-xs rounded-lg border border-border hover:bg-white/5"
                                      onClick={async () => {
                                        try {
                                          const blob = await (espaciosService as any).downloadArchivo(a.id);
                                          downloadBlob(blob, a.filename_original || 'archivo');
                                        } catch (e: any) {
                                          setArchivosErr(e?.message ?? 'No se pudo descargar');
                                        }
                                      }}
                                    >
                                      Descargar
                                    </button>

                                    <button
                                      className="px-3 py-2 text-xs rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10"
                                      onClick={async () => {
                                        const ok = confirm(`¿Eliminar "${a.filename_original}"?`);
                                        if (!ok) return;
                                        try {
                                          await (espaciosService as any).deleteArchivo(a.id);
                                          await refreshArchivos(selectedEspacio!.id);
                                        } catch (e: any) {
                                          setArchivosErr(e?.message ?? 'No se pudo eliminar');
                                        }
                                      }}
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-4 text-[11px] text-textSecondary opacity-80">
                            Nota: Eliminar marca el archivo como borrado y se excluye del RAG.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                */}






                {/* Input */}
                <div className="p-6 border-t border-border">
                  <div className="max-w-4xl mx-auto relative">
                    <input
                      className="w-full bg-card border border-border rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:border-accent shadow-lg"
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
                    />
                    <button
                      onClick={handleSend}
                      disabled={!selectedConv || loadingHistory || sending || !input.trim()}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-accent hover:bg-blue-600 rounded-xl transition-all disabled:opacity-50"
                    >
                      <IconSend className="w-6 h-6 text-white" />
                    </button>
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
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Crear espacio</h3>
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

            <div className="p-5 space-y-3">
              <Field label="Nombre" value={form.nombre} onChange={(v) => setForm((s) => ({ ...s, nombre: v }))} />
              <div className="grid grid-cols-2 gap-3">
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

            <div className="p-5 border-t border-border flex gap-2 justify-end">
              <button
                onClick={() => {
                  if (!creating) {
                    setOpenCreate(false);
                    resetForm();
                    setErr(null);
                  }
                }}
                className="px-4 py-2 text-xs rounded-lg border border-border hover:bg-white/50 transition-all"
                disabled={creating}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateEspacio}
                className="px-4 py-2 text-xs rounded-lg bg-accent text-black hover:bg-white transition-all disabled:opacity-50"
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

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'archivo';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
export default EspaciosSection;
