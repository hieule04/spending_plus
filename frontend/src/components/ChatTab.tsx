import { useState, useRef, useEffect } from "react";
import MobilePageHeader from "./MobilePageHeader";
import { sendChatMessage, getChatHistory } from "../service/api";
import { useLanguage } from "../context/LanguageContext";

interface Message {
  id: number;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface ChatTabProps {
  onOpenMobileMenu?: () => void;
}

export default function ChatTab({ onOpenMobileMenu }: ChatTabProps) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getChatHistory();
        if (history && history.length > 0) {
          const formattedHistory: Message[] = history.map((msg: any) => ({
            id: msg.id,
            role: msg.role === 'user' ? 'user' : 'ai',
            content: msg.content,
            timestamp: new Date(msg.created_at)
          }));
          setMessages(formattedHistory);
        } else {
          // No history, show welcome message
          setMessages([
            {
              id: Date.now(),
              role: "ai",
              content: t("chat.welcome"),
              timestamp: new Date(),
            },
          ]);
        }
      } catch {
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchHistory();
  }, [t]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isInitialLoading]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const data = await sendChatMessage(trimmed);
      const aiMsg: Message = {
        id: Date.now() + 1,
        role: "ai",
        content: data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Nếu AI tự động tạo giao dịch → hiện toast + refresh tabs khác
      if (data.transaction_created) {
        setShowToast(true);
        window.dispatchEvent(new Event("refresh_transactions"));
        setTimeout(() => setShowToast(false), 4000);
      }
    } catch (error) {
      const fallbackMessage = t("chat.error");
      const detailedMessage =
        error instanceof Error && error.message.trim()
          ? error.message.trim()
          : fallbackMessage;

      const errorMsg: Message = {
        id: Date.now() + 1,
        role: "ai",
        content: detailedMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const cardClass =
    "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-3xl";
  const headingClass = "text-slate-900 dark:text-white font-bold";
  const subTextClass = "text-slate-500 dark:text-slate-400 font-bold";

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden animate-fade-in">
      <MobilePageHeader onOpenMobileMenu={onOpenMobileMenu} className="mb-4 shrink-0" />

      {/* Toast thông báo giao dịch tự động */}
      {showToast && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-6 py-3 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center gap-2 text-sm font-bold">
            <span>✅</span>
            <span>Giao dịch đã được tự động thêm!</span>
          </div>
        </div>
      )}
      {/* Combined Chat Panel */}
      <div className={`flex min-h-0 flex-1 flex-col overflow-hidden ${cardClass}`}>
        {/* Header (Internal) */}
        <div className={`shrink-0 flex items-center gap-4 border-b border-slate-100 bg-slate-50/50 p-4 dark:border-slate-700/50 dark:bg-slate-800/50 sm:p-5`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <h2 className={`text-base ${headingClass}`}>{t("chat.title")}</h2>
            <p className={`text-[11px] ${subTextClass}`}>{t("chat.subtitle")}</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="mobile-scroll-region min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          {isInitialLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 relative group ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : "bg-slate-100 dark:bg-slate-700/60 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
                  }`}
                >
                  {msg.role === "ai" && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-500 dark:text-purple-400">
                        AI
                      </span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                  <span
                    className={`text-[9px] mt-1 block ${
                      msg.role === "user"
                        ? "text-blue-100/80"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            ))
          )}

          {/* Thinking indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-2xl px-4 py-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-500 dark:text-purple-400">
                    AI
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                  <span className="text-xs font-medium">{t("chat.thinking")}</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area (Internal) */}
        <div className="shrink-0 border-t border-slate-100 bg-slate-50/30 p-3 dark:border-slate-700/50 dark:bg-slate-800/30 sm:p-4">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 transition-all shadow-inner">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("chat.placeholder")}
              disabled={isLoading}
              className="flex-1 bg-transparent text-slate-900 dark:text-white px-3 py-2 text-sm font-medium outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl p-2.5 shadow-md shadow-blue-500/20 transition-all hover:scale-[1.05] active:scale-[0.95] disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
              title={t("chat.send")}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
