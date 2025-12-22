"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { Message, Role, ChatSession } from "./types";
import { geminiService } from "./services/gemini";
import ChatMessage from "./components/ChatMessage";
import {
  SendIcon,
  PlusIcon,
  MessageIcon,
  TrashIcon,
  MenuIcon,
  RobotIcon,
  ChevronDownIcon,
  PaperclipIcon,
} from "./components/Icons";
import { fileToBase64 } from "./utils/filetoBase64";
import ImageModal from "./components/ImageModal";

const AVAILABLE_MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite" },
];

export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [imageBase64, setImageBase64] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Initialize and load from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem("chat_sessions_next");
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions).map((s: any) => ({
          ...s,
          updatedAt: new Date(s.updatedAt),
          messages: s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        }));
        setSessions(parsed);
        if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
      } catch (e) {
        console.error("Error loading sessions", e);
        createNewSession();
      }
    } else {
      createNewSession();
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(event.target as Node)
      ) {
        setIsModelDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  // handle pase image
  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      console.log("clipBoardData", event.clipboardData);
      if (!items) return;

      for (const item of items) {
        console.log("item", item);
        if (item.type.startsWith("image")) {
          const file = item.getAsFile();
          console.log("file", file);
          if (!file) continue;

          const base64 = await fileToBase64(file);
          setImageBase64(base64);
          setIsImagePreviewOpen(true);
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  // Save to localStorage whenever sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("chat_sessions_next", JSON.stringify(sessions));
    }
  }, [sessions]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessions, isGenerating]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: "Cuộc hội thoại mới",
      messages: [],
      updatedAt: new Date(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (currentSessionId === id) {
        setCurrentSessionId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  const onImageClick = useCallback((src: string) => {
    setPreviewImage(src);
  }, []);

  const handleSendMessage = async () => {
    if ((!input.trim() && !imageBase64) || isGenerating || !currentSessionId)
      return;

    const userMsgContent = input.trim();
    const userMessage: Message = {
      id: uuidv4(),
      role: Role.USER,
      content: userMsgContent,
      timestamp: new Date(),
      ...(imageBase64 && { imageBase64 }),
    };

    const targetSessionId = currentSessionId;
    setInput("");
    setIsGenerating(true);
    // Keep image preview if there's no text, otherwise clear it
    if (input.trim()) {
      setImageBase64("");
      setIsImagePreviewOpen(false);
    }

    // Update session state
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === targetSessionId) {
          const isFirstMessage = s.messages.length === 0;
          return {
            ...s,
            title: isFirstMessage
              ? userMsgContent.slice(0, 35) +
                (userMsgContent.length > 35 ? "..." : "")
              : s.title,
            messages: [...s.messages, userMessage],
            updatedAt: new Date(),
          };
        }
        return s;
      })
    );

    const aiMessageId = uuidv4();
    const aiPlaceholder: Message = {
      id: aiMessageId,
      role: Role.MODEL,
      content: "",
      timestamp: new Date(),
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === targetSessionId
          ? { ...s, messages: [...s.messages, aiPlaceholder] }
          : s
      )
    );

    try {
      const session = sessions.find((s) => s.id === targetSessionId);
      const history = session ? session.messages.slice(0, -2) : []; // Exclude user and placeholder

      let fullResponse = "";
      const imageToSend = imageBase64
        ? { url: imageBase64, mimeType: "" }
        : undefined;

      for await (const chunk of geminiService.streamChat(
        history,
        userMsgContent,
        selectedModel,
        imageToSend?.url
      )) {
        fullResponse += chunk;
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === targetSessionId) {
              return {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === aiMessageId ? { ...m, content: fullResponse } : m
                ),
              };
            }
            return s;
          })
        );
      }
      // Clear image preview after successful send
      setIsImagePreviewOpen(false);
      setImageBase64("");
    } catch (error) {
      console.error(error);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === aiMessageId
                    ? {
                        ...m,
                        content:
                          "Lỗi kết nối API. Hãy kiểm tra lại kết nối mạng.",
                      }
                    : m
                ),
              }
            : s
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const base64 = await fileToBase64(file);
    setImageBase64(base64);
    setIsImagePreviewOpen(true);
  };

  const currentSession = sessions.find((s) => s.id === currentSessionId);

  return (
    <div className="flex h-screen w-full bg-gray-950">
      {/* Sidebar mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed md:static inset-y-0 left-0 z-30 w-72 bg-gray-900/80 backdrop-blur-xl border-r border-gray-800/50 flex flex-col transition-transform duration-300
        ${
          isSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full md:w-0 md:opacity-0 md:pointer-events-none"
        }
      `}
      >
        <div className="p-4">
          <button
            onClick={createNewSession}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20"
          >
            <PlusIcon className="w-5 h-5" />
            <span className="font-semibold text-sm">New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1.5">
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => {
                setCurrentSessionId(s.id);
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }}
              className={`
                group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors
                ${
                  currentSessionId === s.id
                    ? "bg-gray-800/80 text-white"
                    : "hover:bg-gray-800/50 text-gray-400"
                }
              `}
            >
              <MessageIcon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm truncate flex-1">{s.title}</span>
              <button
                onClick={(e) => deleteSession(e, s.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-800/50 mt-auto">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-xs">
              AI
            </div>
            <span className="text-sm font-medium text-gray-300">
              NextJS 15 + Gemini
            </span>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-gray-950">
        <header className="h-14 flex items-center justify-between px-4 border-b border-gray-800/50 backdrop-blur-lg bg-gray-900/30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-800/50 rounded-lg"
            >
              <MenuIcon />
            </button>

            <div className="relative" ref={modelDropdownRef}>
              <button
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-800/50 rounded-lg transition-colors group"
              >
                <span className="text-sm font-bold tracking-tight text-white uppercase">
                  {AVAILABLE_MODELS.find((m) => m.id === selectedModel)?.name ||
                    "Gemini"}
                </span>
                <ChevronDownIcon
                  className={`w-4 h-4 text-gray-400 group-hover:text-white transition-transform ${
                    isModelDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isModelDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-gray-900/90 backdrop-blur-lg border border-gray-700/50 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                  {AVAILABLE_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setIsModelDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-gray-800/50 flex items-center justify-between
                        ${
                          selectedModel === model.id
                            ? "text-indigo-400 bg-gray-800/50"
                            : "text-gray-300"
                        }
                      `}
                    >
                      {model.name}
                      {selectedModel === model.id && (
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6"
        >
          {!currentSession || currentSession.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center ">
              <RobotIcon className="w-16 h-16 mb-4 text-indigo-500" />
              <h2 className="text-2xl font-semibold text-white">
                How can I help you today?
              </h2>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-8">
              {currentSession.messages.map((m) => (
                <ChatMessage
                  key={m.id}
                  message={m}
                  onImageClick={onImageClick}
                />
              ))}
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="bg-gray-800/80 p-4 rounded-2xl animate-pulse text-indigo-400 text-sm">
                    Thinking...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="p-4 absolute bottom-0 w-full md:p-6 bg-gradient-to-t from-gray-950 via-gray-950 to-transparent">
          <div className="max-w-3xl mx-auto relative group">
            {isImagePreviewOpen && imageBase64 && (
              <div className="absolute bottom-full left-0 right-0 p-2 bg-gray-800/50 rounded-t-lg">
                <div className="relative">
                  <img
                    src={imageBase64}
                    alt="preview"
                    className="h-24 w-auto rounded-lg"
                  />
                  <button
                    onClick={() => {
                      setIsImagePreviewOpen(false);
                      setImageBase64("");
                    }}
                    className="absolute top-1 right-1 bg-gray-900/50 rounded-full p-1"
                  >
                    <PlusIcon className="w-4 h-4 rotate-45" />
                  </button>
                </div>
              </div>
            )}
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Message Gemini..."
              className="w-full bg-gray-900/50 border border-gray-700/50 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl p-4 pl-14 pr-16 text-gray-100 placeholder-gray-500 resize-none transition-all outline-none"
              style={{ minHeight: "56px" }}
            />
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
            <label
              htmlFor="file-upload"
              className="absolute left-3 bottom-3 p-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-full cursor-pointer transition-all"
            >
              <PaperclipIcon className="w-5 h-5" />
            </label>
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isGenerating}
              className="absolute right-3 bottom-3 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 rounded-full transition-all shadow-lg shadow-indigo-500/20"
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
      {previewImage && (
        <ImageModal src={previewImage} onClose={() => setPreviewImage(null)} />
      )}
    </div>
  );
}
