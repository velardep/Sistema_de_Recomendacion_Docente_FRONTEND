// pages/dashboard/ChatGeneralSection.tsx
import React, { useState, useRef, useEffect } from 'react';
import { chatsService, Chat as ChatApi } from '../../services/chatsService';
import { IconSend, IconChat } from '../../shared/components/Icons';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const LS_CHAT_GENERAL_ID = 'nexus_chat_general_id';

const ChatGeneralSection: React.FC = () => {
  const [chatId, setChatId] = useState<string | null>(() => localStorage.getItem(LS_CHAT_GENERAL_ID));
  const [chatList, setChatList] = useState<ChatApi[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loadingInit, setLoadingInit] = useState(true);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadChat = async (id: string) => {
    const history = await chatsService.getChat(id);
    const mapped: ChatMessage[] = (history.messages || []).map((m) => ({
      role: m.role,
      content: m.content,
    }));
    setMessages(mapped);
  };

  const refreshChats = async () => {
    const chats = await chatsService.listChats();
    setChatList(chats);
  };

  // autoscroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  // init
  useEffect(() => {
    const init = async () => {
      setErr(null);
      setLoadingInit(true);
      try {
        await refreshChats();

        let id = chatId;

        // si no hay chat seleccionado -> crea uno
        if (!id) {
          const created = await chatsService.createChat('Chat General');
          id = created.id;
          setChatId(id);
          localStorage.setItem(LS_CHAT_GENERAL_ID, id);
          await refreshChats();
        }

        await loadChat(id);
      } catch (e: any) {
        setErr(e?.message ?? 'Error cargando chat general');
      } finally {
        setLoadingInit(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectChat = async (id: string) => {
    setErr(null);
    setLoadingInit(true);
    try {
      setChatId(id);
      localStorage.setItem(LS_CHAT_GENERAL_ID, id);
      await loadChat(id);
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
      // título genérico; backend lo renombrará con la primera consulta
      const created = await chatsService.createChat('Chat General');
      setChatId(created.id);
      localStorage.setItem(LS_CHAT_GENERAL_ID, created.id);

      await refreshChats();
      await loadChat(created.id);
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
        { role: res.assistant_message.role, content: res.assistant_message.content },
      ]);
      if (res.conversation?.id) {
        setChatList(prev =>
          prev.map(c => c.id === res.conversation!.id ? res.conversation! : c)
        );
      }

      // refrescamos lista: por si el backend renombró el titulo con la primera consulta
      await refreshChats();
    } catch (e: any) {
      setErr(e?.message ?? 'Error enviando mensaje');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 flex h-full">
      {/* Sidebar de chats */}
      <aside className="w-80 border-r border-border bg-black/20 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Chats</h2>
            <button
              onClick={handleNewChat}
              className="px-3 py-2 text-xs bg-accent/10 text-accent border border-accent/20 rounded-lg hover:bg-accent/20 transition-all"
            >
              Nuevo
            </button>
          </div>

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

      {/* Chat */}
      <div className="flex-1 flex flex-col h-full">
        <header className="p-6 border-b border-border">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <IconChat className="w-5 h-5" />
            Chat General
          </h1>
          <p className="text-sm text-textSecondary">RAG prontuario + búsqueda web cuando haga falta</p>
        </header>

        {err && (
          <div className="px-6 py-3 text-sm text-red-400 border-b border-border">
            {err}
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {loadingInit ? (
            <div className="h-full flex items-center justify-center opacity-60">
              Cargando historial...
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <IconChat className="w-16 h-16 mb-4" />
              <p className="text-lg">¿En qué puedo ayudarte hoy?</p>
            </div>
          ) : (
            <>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                      m.role === 'user'
                        ? 'bg-accent text-white rounded-tr-none'
                        : 'bg-card border border-border rounded-tl-none'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
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

        <div className="p-6 border-t border-border">
          <div className="max-w-4xl mx-auto relative">
            <input
              className="w-full bg-card border border-border rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:border-accent shadow-lg"
              placeholder="Escribe tu mensaje aquí..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={loadingInit || !chatId}
            />
            <button
              onClick={handleSend}
              disabled={loadingInit || sending || !input.trim() || !chatId}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-accent hover:bg-blue-600 rounded-xl transition-all disabled:opacity-50"
            >
              <IconSend className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatGeneralSection;
