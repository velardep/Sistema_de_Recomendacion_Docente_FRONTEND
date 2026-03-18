// pages/dashboard/ChatGeneralSection.tsx
import React, { useState, useRef, useEffect } from 'react';
import { chatsService, Chat as ChatApi } from '../../services/chatsService';
import { IconSend, IconChat } from '../../shared/components/Icons';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const safeArray = <T,>(v: any): T[] => (Array.isArray(v) ? v : []);
const safeString = (v: any): string =>
  typeof v === 'string' ? v : v == null ? '' : String(v);

const ChatGeneralSection: React.FC = () => {
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatList, setChatList] = useState<ChatApi[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loadingInit, setLoadingInit] = useState(true);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [mobileChatsOpen, setMobileChatsOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const initRanRef = useRef(false);

  const loadChat = async (id: string) => {
    const history: any = await chatsService.getChat(id);

    const raw = safeArray<any>(history?.messages);
    const mapped: ChatMessage[] = raw
      .map(
        (m) =>
          ({
            role: m?.role === 'assistant' ? 'assistant' : 'user',
            content: safeString(m?.content),
          }) as ChatMessage
      )
      .filter((m) => m.content.length > 0);

    setMessages(mapped);
  };

  const refreshChats = async () => {
    const chats = await chatsService.listChats();
    setChatList(chats);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  useEffect(() => {
    if (initRanRef.current) return;
    initRanRef.current = true;

    const init = async () => {
      setErr(null);
      setLoadingInit(true);
      try {
        const chats = await chatsService.listChats();
        setChatList(chats);

        let selected = chats.find(
          (c) => (c.titulo || '').trim().toLowerCase() === 'chat general'
        );

        if (!selected) {
          selected = await chatsService.createChat('Chat General');
          const chats2 = await chatsService.listChats();
          setChatList(chats2);
        }

        setChatId(selected.id);
        await loadChat(selected.id);
      } catch (e: any) {
        setErr(e?.message ?? 'Error cargando chat general');
      } finally {
        setLoadingInit(false);
      }
    };

    init();
  }, []);

  const handleSelectChat = async (id: string) => {
    setErr(null);
    setLoadingInit(true);
    try {
      setChatId(id);
      await loadChat(id);
      setMobileChatsOpen(false);
    } catch (e: any) {
      setErr(e?.message ?? 'No se pudo cargar el chat');
    } finally {
      setLoadingInit(false);
    }
  };

  const handleNewChat = async () => {
    setErr(null);
    setSending(false);
    setLoadingInit(true);
    try {
      const created = await chatsService.createChat('Chat General');
      setChatId(created.id);

      await refreshChats();
      await loadChat(created.id);
      setMobileChatsOpen(false);
    } catch (e: any) {
      setErr(e?.message ?? 'No se pudo crear un nuevo chat');
    } finally {
      setLoadingInit(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending || !chatId) return;

    const content = input.trim();
    setInput('');
    setErr(null);

    setMessages((prev) => [...prev, { role: 'user', content }]);
    setSending(true);

    try {
      const res = await chatsService.sendMessagePlus(chatId, content);

      setMessages((prev) => [
        ...prev,
        {
          role: res.assistant_message.role,
          content: res.assistant_message.content,
        },
      ]);

      if (res.conversation?.id) {
        setChatList((prev) =>
          prev.map((c) =>
            c.id === res.conversation!.id ? res.conversation! : c
          )
        );
      }

      await refreshChats();
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

  return (
    <div className="relative flex h-full min-h-0 bg-background">
      {mobileChatsOpen && (
        <button
          type="button"
          aria-label="Cerrar panel de chats"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileChatsOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] border-r border-border bg-card
          transform transition-transform duration-300 ease-in-out
          lg:static lg:z-0 lg:w-80 lg:max-w-none lg:translate-x-0
          ${mobileChatsOpen ? 'translate-x-0' : '-translate-x-full'}
          flex h-full flex-col
        `}
      >
        <div className="flex items-center justify-between border-b border-border p-4 sm:p-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold">Chats</h2>
            <p className="text-xs text-textSecondary mt-1">
              Historial del chat general
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNewChat}
              className="px-3 py-2 text-xs bg-accent/10 text-accent border border-accent/20 rounded-lg hover:bg-accent/20 transition-all"
            >
              Nuevo
            </button>

            <button
              type="button"
              aria-label="Cerrar panel"
              onClick={() => setMobileChatsOpen(false)}
              className="lg:hidden rounded-lg border border-border bg-white/5 px-2 py-2 text-sm hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="space-y-2">
            {chatList.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelectChat(c.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  chatId === c.id
                    ? 'bg-accent/10 border-accent/40 ring-1 ring-accent/40'
                    : 'bg-card border-border hover:bg-white/5 hover:border-textSecondary/30'
                }`}
              >
                <div className="text-sm font-semibold line-clamp-1">
                  {c.titulo || 'Conversación'}
                </div>
                <div className="text-[11px] text-textSecondary mt-1 line-clamp-1">
                  {new Date(c.created_at).toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col h-full">
        <header className="border-b border-border px-4 py-3 sm:px-5 sm:py-4 lg:px-6">
          <div className="flex items-start gap-3 sm:items-center justify-between">
            <div className="min-w-0 flex items-start gap-3">
              <button
                type="button"
                aria-label="Abrir historial de chats"
                onClick={() => setMobileChatsOpen(true)}
                className="lg:hidden mt-0.5 rounded-lg border border-border bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition-colors"
              >
                ☰
              </button>

              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <IconChat className="w-5 h-5 shrink-0" />
                  <span className="truncate">Chat General</span>
                </h1>
                <p className="text-xs sm:text-sm text-textSecondary mt-1">
                  RAG prontuario + búsqueda web cuando haga falta
                </p>
              </div>
            </div>

            <button
              onClick={handleNewChat}
              className="hidden sm:inline-flex lg:hidden px-3 py-2 text-xs bg-accent/10 text-accent border border-accent/20 rounded-lg hover:bg-accent/20 transition-all"
            >
              Nuevo
            </button>
          </div>
        </header>

        {err && (
          <div className="px-4 py-3 sm:px-6 text-sm text-red-400 border-b border-border">
            {err}
          </div>
        )}

        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto px-3 py-4 sm:px-4 sm:py-5 lg:px-6"
        >
          {loadingInit ? (
            <div className="h-full flex items-center justify-center opacity-60 text-sm sm:text-base">
              Cargando historial...
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 px-4">
              <IconChat className="w-14 h-14 sm:w-16 sm:h-16 mb-4" />
              <p className="text-base sm:text-lg">¿En qué puedo ayudarte hoy?</p>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      w-fit max-w-[92%] sm:max-w-[85%] lg:max-w-[80%]
                      rounded-2xl px-4 py-3 sm:px-5
                      ${m.role === 'user'
                        ? 'bg-accent text-black rounded-tr-none'
                        : 'bg-card border border-border rounded-tl-none'
                      }
                    `}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {m.content}
                    </p>
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border rounded-2xl rounded-tl-none px-4 py-3 sm:px-5 animate-pulse">
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

        <div className="border-t border-border px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
          <div className="mx-auto w-full max-w-4xl">
            <div className="relative">
              <textarea
                className="min-h-[56px] max-h-40 w-full resize-none rounded-2xl border border-border bg-card px-4 py-4 pr-14 text-sm shadow-lg focus:outline-none focus:border-accent"
                placeholder="Escribe tu mensaje aquí..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === 'Enter' &&
                    !e.shiftKey &&
                    !(e.nativeEvent as any).isComposing
                  ) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={loadingInit || !chatId}
                rows={1}
              />

              <button
                onClick={handleSend}
                disabled={loadingInit || sending || !input.trim() || !chatId}
                className="absolute right-2 bottom-2 p-2.5 bg-accent hover:bg-blue-600 rounded-xl transition-all disabled:opacity-50"
              >
                <IconSend className="w-5 h-5 text-white" />
              </button>
            </div>

            <p className="mt-2 px-1 text-[11px] sm:text-xs text-textSecondary">
              Enter para enviar · Shift + Enter para salto de línea
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatGeneralSection;