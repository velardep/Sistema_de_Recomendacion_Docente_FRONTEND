import React, { useEffect, useMemo, useRef, useState } from 'react';
import { espaciosService } from '../../services/espaciosService';
import type { Espacio, EspacioConversation, EspacioMessageApi } from '../../types';
import { IconPlus, IconSend, IconGrid, IconChat } from '../../shared/components/Icons';

type UiMsg = { role: 'user' | 'assistant'; content: string };

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
      const data = await espaciosService.getChat(espacioId, conv.id);
      const mapped: UiMsg[] = (data.messages || []).map((m: EspacioMessageApi) => ({
        role: m.rol,
        content: m.contenido,
      }));
      setMessages(mapped);
    } catch (ex: any) {
      setErr(ex?.message ?? 'No se pudo cargar el historial del chat');
    } finally {
      setLoadingHistory(false);
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
    } catch (e: any) {
      setErr(e?.message ?? 'Error enviando mensaje');
    } finally {
      setSending(false);
    }
  };

  // -----------------------------
  // Subir archivos
  // -----------------------------
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = () => {
    setUploadMsg(null);
    fileInputRef.current?.click();
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const espacioTitle = useMemo(() => selectedEspacio?.nombre ?? 'Espacios', [selectedEspacio]);

  return (
    <div className="flex h-full">
      {/* Sidebar Espacios */}
      <div className="w-80 border-r border-border bg-black/20 overflow-y-auto">
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
                className="mt-4 w-full px-4 py-2 text-xs bg-accent text-white rounded-lg hover:bg-blue-600 transition-all"
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

      {/* Main */}
      <div className="flex-1 flex flex-col bg-background/50">
        {!selectedEspacio ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-80">
            <div className="p-8 rounded-full bg-accent/5 mb-6">
              <IconGrid className="w-24 h-24 text-accent" />
            </div>
            <h3 className="text-xl font-bold">Panel de Espacios</h3>
            <p className="mt-2 text-textSecondary">
              {espacios.length === 0 ? 'Crea un espacio para comenzar' : 'Selecciona un espacio para comenzar'}
            </p>

            <button
              onClick={() => setOpenCreate(true)}
              className="mt-6 px-6 py-3 text-sm bg-accent text-white rounded-xl hover:bg-blue-600 transition-all"
            >
              Crear espacio
            </button>
          </div>
        ) : (
          <>
            <header className="p-6 border-b border-border flex items-center justify-between bg-card/30 backdrop-blur-md">
              <div>
                <h2 className="text-xl font-bold">{espacioTitle}</h2>
                <p className="text-xs text-textSecondary mt-1">
                  Chat contextual basado únicamente en el material del espacio
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleNewChat}
                  className="px-4 py-2 text-xs bg-accent/10 text-accent border border-accent/20 rounded-lg hover:bg-accent/20 transition-all"
                >
                  Nuevo chat
                </button>

                <button
                  onClick={openFilePicker}
                  disabled={!selectedEspacio || uploading}
                  className="px-4 py-2 text-xs bg-accent/10 text-accent border border-accent/20 rounded-lg hover:bg-accent/20 transition-all disabled:opacity-50"
                >
                  {uploading ? 'Subiendo...' : 'Subir Base de Conocimiento'}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt"
                  className="hidden"
                  onChange={onPickFile}
                />
              </div>
            </header>

            {err && <div className="px-6 py-3 text-sm text-red-400 border-b border-border">{err}</div>}
            {uploadMsg && (
              <div className="px-6 py-3 text-sm border-b border-border">
                <span className="text-textSecondary">{uploadMsg}</span>
              </div>
            )}

            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar Conversaciones del espacio */}
              <div className="w-80 border-r border-border bg-black/10 overflow-y-auto">
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

              {/* Chat */}
              <div className="flex-1 flex flex-col">
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
                                ? 'bg-accent text-white rounded-tr-none'
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
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
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
                className="px-4 py-2 text-xs rounded-lg border border-border hover:bg-white/5 transition-all"
                disabled={creating}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateEspacio}
                className="px-4 py-2 text-xs rounded-lg bg-accent text-white hover:bg-blue-600 transition-all disabled:opacity-50"
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

export default EspaciosSection;
