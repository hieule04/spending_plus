import { useState, useRef, useEffect } from "react";
import { sendChatMessage, getChatHistory } from "../service/api";
import { useLanguage } from "../context/LanguageContext";

interface Message {
  id: number;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

export default function ChatTab() {
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
      } catch (e) {
        console.error("Failed to load chat history", e);
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
    } catch {
      const errorMsg: Message = {
        id: Date.now() + 1,
        role: "ai",
        content: t("chat.error"),
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
    <div className="flex flex-col h-full animate-fade-in relative">
      {/* Toast thông báo giao dịch tự động */}
      {showToast && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-6 py-3 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center gap-2 text-sm font-bold">
            <span>✅</span>
            <span>Giao dịch đã được tự động thêm!</span>
          </div>
        </div>
      )}
      {/* Header */}
      <div
        className={`flex items-center gap-4 p-5 sm:p-6 rounded-3xl mb-4 ${cardClass}`}
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
          <span className="text-2xl">🤖</span>
        </div>
        <div>
          <h2 className={`text-lg ${headingClass}`}>{t("chat.title")}</h2>
          <p className={`text-sm ${subTextClass}`}>{t("chat.subtitle")}</p>
        </div>
      </div>

      {/* Messages Area */}
      <div
        className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 rounded-3xl mb-4 ${cardClass}`}
      >
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
                className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-5 py-3 relative group ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "bg-slate-100 dark:bg-slate-700/60 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
                }`}
              >
                {msg.role === "ai" && (
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-purple-500 dark:text-purple-400">
                      AI
                    </span>
                  </div>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
                <span
                  className={`text-[10px] mt-1.5 block ${
                    msg.role === "user"
                      ? "text-blue-200"
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
            <div className="bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-2xl px-5 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold text-purple-500 dark:text-purple-400">
                  AI
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
                <span className="font-medium">{t("chat.thinking")}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div
        className={`flex items-center gap-3 p-3 sm:p-4 rounded-2xl ${cardClass}`}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("chat.placeholder")}
          disabled={isLoading}
          className="flex-1 bg-slate-100 dark:bg-slate-700/50 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm font-medium outline-none border border-transparent focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl px-5 py-3 text-sm font-bold shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none whitespace-nowrap"
        >
          {t("chat.send")} ✨
        </button>
      </div>
    </div>
  );
}
