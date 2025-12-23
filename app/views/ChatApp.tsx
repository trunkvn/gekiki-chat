"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

import { useAuth, useUser } from "@clerk/nextjs";
import { ChatSession, Message, Role } from "../types";
import { fileToBase64 } from "../utils/filetoBase64";
import { geminiService } from "../services/gemini";
import { useVoiceInput } from "../hooks/useVoiceInput";
import {
  ChevronDownIcon,
  LogOutIcon,
  MenuIcon,
  MicIcon,
  PaperclipIcon,
  PinIcon,
  PlusIcon,
  SendIcon,
  TrashIcon,
} from "../components/Icons";
import ChatMessage from "../components/ChatMessage";
import ImageModal from "../components/ImageModal";

const AVAILABLE_MODELS = [
  { id: "gemini-2.5-flash", name: "Gekiki 2.5 Flash" },
  { id: "gemini-2.5-flash-lite", name: "Gekiki 2.5 Flash Lite" },
];

export default function ChatApp() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("isSidebarOpen");
    if (saved) {
      setIsSidebarOpen(JSON.parse(saved));
    }
  }, []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [attachment, setAttachment] = useState<{
    content: string;
    mimeType: string;
    fileName: string;
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  // Initialize and load from localStorage

  useEffect(() => {
    // set sidebar localStorage
    localStorage.setItem("isSidebarOpen", JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);
  useEffect(() => {
    if (!isLoaded || !user) return;

    const savedSessions = localStorage.getItem(`chat_sessions_${user.id}`);

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
        // Only set current session if none is selected or logic dictates
        if (!currentSessionId && parsed.length > 0) {
            setCurrentSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error("Error loading sessions", e);
        setSessions([]);
        setCurrentSessionId(null);
      }
    } else {
      setSessions([]);
      setCurrentSessionId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id]); // Depend on user.id

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
          setAttachment({
            content: base64,
            mimeType: file.type,
            fileName: file.name,
          });
          setIsImagePreviewOpen(true);
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  // Save to localStorage whenever sessions change
  useEffect(() => {
    if (!isLoaded || !user) return;
    if (sessions.length > 0) {
      localStorage.setItem(`chat_sessions_${user.id}`, JSON.stringify(sessions));
    }
  }, [sessions, user, isLoaded]);

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
      // Also update localStorage immediately if needed, or rely on useEffect
      if (filtered.length === 0 && user?.id) {
          localStorage.removeItem(`chat_sessions_${user.id}`);
      }
      return filtered;
    });
  };
  
  const togglePinSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isPinned: !s.isPinned } : s))
    );
  };

  const onImageClick = useCallback((src: string) => {
    setPreviewImage(src);
  }, []);

  const handleSendMessage = async (message?: string) => {
  
    // Logic fix: (!message && !image) prevents empty sends.
    // Removed !currentSessionId check so we can create one on the fly.
    if ((!message?.trim() && !attachment) || isGenerating)
      return;
    
    setFileError(null); // Clear error on send
    
    const userMsgContent = message?.trim() || input.trim();
    const userMessage: Message = {
      id: uuidv4(),
      role: Role.USER,
      content: userMsgContent,
      timestamp: new Date(),
      ...(attachment && { attachment }),
    };

    let targetSessionId = currentSessionId;
    if (!targetSessionId) {
      const newSession: ChatSession = {
        id: uuidv4(),
        title:
          userMsgContent.slice(0, 35) +
          (userMsgContent.length > 35 ? "..." : ""),
        messages: [],
        updatedAt: new Date(),
      };

      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      targetSessionId = newSession.id;
    }
    setInput("");
    setIsGenerating(true);
    // Keep attachment preview if there's no text, otherwise clear it
    if (input.trim()) {
      setAttachment(null);
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
      const fileToSend = attachment
        ? { content: attachment.content, mimeType: attachment.mimeType }
        : undefined;

      for await (const chunk of geminiService.streamChat(
        history,
        userMsgContent,
        selectedModel,
        fileToSend
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
      setIsImagePreviewOpen(false);
      setAttachment(null);
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
  const voice = useVoiceInput(
    (text) => {
      setInput(text);
      setTimeout(() => {
        handleSendMessage(text);
      }, 200);
    },
    () => setIsRecording(true),
    () => setIsRecording(false)
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Validate file type
    const isValid = file.type.startsWith("image/") || file.type === "application/pdf" || file.type.startsWith("text/");
    
    if (!isValid) {
      setFileError(`Định dạng file "${file.name}" không được hỗ trợ. Vui lòng gửi ảnh, PDF hoặc file văn bản.`);
      return;
    }

    setFileError(null);
    const base64 = await fileToBase64(file);
    setAttachment({
      content: base64,
      mimeType: file.type,
      fileName: file.name,
    });
    setIsImagePreviewOpen(true);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isValid = file.type.startsWith("image/") || file.type === "application/pdf" || file.type.startsWith("text/");
    
    if (!isValid) {
      setFileError(`Định dạng file "${file.name}" không được hỗ trợ. Vui lòng gửi ảnh, PDF hoặc file văn bản.`);
      event.target.value = ""; // Clear input
      return;
    }

    setFileError(null);
    const base64 = await fileToBase64(file);
    setAttachment({
      content: base64,
      mimeType: file.type,
      fileName: file.name,
    });
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
      <aside
        className={`
        fixed md:static inset-y-0 left-0 z-30 border-zinc-900 border-r border bg-zinc-950 flex flex-col transition-all duration-300
        ${
          isSidebarOpen
            ? "w-72 translate-x-0"
            : "-translate-x-full md:translate-x-0 md:w-20"
        }
      `}
      >
        <div
          className={`p-4 border-b border-zinc-900 flex items-center ${
            isSidebarOpen ? "justify-start gap-3" : "justify-center"
          }`}
        >
          {/* <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-900/20">
       <RobotIcon className="w-16 h-16 mb-4 text-indigo-500" /> 
          </div> */}
          {isSidebarOpen ? (
            <span className="font-semibold tracking-tight">Gekiki Chat</span>
          ) : (
            <span className="font-bold text-xl">G</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <button
            onClick={createNewSession}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 transition-colors ${
              isSidebarOpen ? "text-left" : "justify-center"
            }`}
          >
            <PlusIcon className="w-5 h-5" />
            {isSidebarOpen && <span>Đoạn chat mới</span>}
          </button>

          {isSidebarOpen ? (
            <div className="pt-4 px-2">
              {sessions.some(s => s.isPinned) && (
                <>
                  <p className="text-[10px] uppercase font-bold text-zinc-600 mb-2">
                    Đã ghim
                  </p>
                  {sessions
                    .filter((s) => s.isPinned)
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                    .map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setCurrentSessionId(s.id);
                        if (window.innerWidth < 768) setIsSidebarOpen(false);
                      }}
                      className={`
                    group flex items-center gap-3 p-3 rounded-md cursor-pointer text-sm transition-colors truncate
                    ${
                      currentSessionId === s.id
                        ? "bg-zinc-900 text-zinc-100"
                        : "hover:bg-zinc-900/50 text-zinc-400 hover:text-zinc-200"
                    }
                  `}
                    >
                      <PinIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="text-sm truncate flex-1">{s.title}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => togglePinSession(e, s.id)}
                          className="p-1 hover:text-indigo-400"
                          title="Bỏ ghim"
                        >
                          <PinIcon className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button
                          onClick={(e) => deleteSession(e, s.id)}
                          className="p-1 hover:text-red-400"
                          title="Xóa"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="my-4 h-[1px] bg-zinc-900" />
                </>
              )}
              
              <p className="text-[10px] uppercase font-bold text-zinc-600 mb-2">
                Gần đây
              </p>
              {sessions
                .filter(s => !s.isPinned)
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setCurrentSessionId(s.id);
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={`
                group flex items-center gap-3 p-3 rounded-md cursor-pointer text-sm transition-colors truncate
                ${
                  currentSessionId === s.id
                    ? "bg-zinc-900 text-zinc-100"
                    : "hover:bg-zinc-900/50 text-zinc-400 hover:text-zinc-200"
                }
              `}
                >
                  <span className="text-sm truncate flex-1">{s.title}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => togglePinSession(e, s.id)}
                      className="p-1 hover:text-indigo-400"
                      title="Ghim"
                    >
                      <PinIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => deleteSession(e, s.id)}
                      className="p-1 hover:text-red-400"
                      title="Xóa"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="pt-4 flex flex-col gap-2 items-center">
              <div className="w-full h-[1px] bg-zinc-900 mb-2" />
              {/* Show only active session indicator or nothing in collapsed mode for simplicity as per common patterns */}
              {sessions.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  onClick={() => setCurrentSessionId(s.id)}
                  className={`w-2 h-2 rounded-full cursor-pointer ${
                    currentSessionId === s.id ? "bg-white" : "bg-zinc-800"
                  }`}
                  title={s.title}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-zinc-900 ">
          <div
            className={`flex items-center gap-3 rounded-md p-2 transition-colors cursor-pointer ${
              isSidebarOpen ? "" : "justify-center"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold shrink-0">
              <img
                src={user?.imageUrl}
                alt={user?.fullName || "Avatar"}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.fullName}</p>
                {/* <p className="text-[10px] text-zinc-500 truncate">Pro Plan</p> */}
              </div>
            )}
            {isSidebarOpen && (
              <button
                onClick={() => signOut()}
                className="p-2 hover:bg-zinc-800/50 rounded-lg"
                title="Đăng xuất"
              >
                <LogOutIcon className="w-5 h-5" />
              </button>
            )}
          </div>
          {!isSidebarOpen && (
            <button
              onClick={() => signOut()}
              className="w-full flex justify-center p-2 mt-2 hover:bg-zinc-800/50 rounded-lg"
            >
              <LogOutIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-zinc-950">
        <header className="h-14 flex items-center justify-between px-4 border-b border-zinc-800/50 backdrop-blur-lg bg-zinc-900/30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-zinc-800/50 rounded-lg"
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
                <div className="absolute top-full left-0 mt-2 w-56 bg-zinc-900/90 backdrop-blur-lg border border-zinc-700/50 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                  {AVAILABLE_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setIsModelDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-zinc-800/50 flex items-center justify-between
                        ${
                          selectedModel === model.id
                            ? "text-zinc-100 bg-zinc-800/50"
                            : "text-zinc-300"
                        }
                      `}
                    >
                      {model.name}
                      {selectedModel === model.id && (
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-600 shadow-[0_0_8px_rgba(255,165,0,0.6)]" />
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
              {/* <RobotIcon className="w-16 h-16 mb-4 text-indigo-500" /> */}
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
                  <div className="bg-zinc-800/80 p-4 rounded-2xl animate-pulse text-zinc-100 text-sm">
                    Thinking...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="p-4  w-full md:p-6 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent">
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`max-w-3xl mx-auto relative group rounded-2xl transition-all duration-200 ${
              isDragging ? "ring-2 ring-indigo-500 bg-indigo-500/10" : ""
            }`}
          >
            {isDragging && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-indigo-500/5 backdrop-blur-[2px] rounded-2xl border-2 border-dashed border-indigo-500 pointer-events-none">
                <div className="flex flex-col items-center gap-2">
                  <PlusIcon className="w-8 h-8 text-indigo-400" />
                </div>
              </div>
            )}
            {fileError && (
              <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-red-400 font-medium">
                  {fileError}
                </span>
                <button 
                  onClick={() => setFileError(null)}
                  className="ml-auto p-1 hover:bg-red-500/20 rounded-md transition-colors"
                >
                  <PlusIcon className="w-3.5 h-3.5 rotate-45 text-red-400" />
                </button>
              </div>
            )}
            {isImagePreviewOpen && attachment && (
              <div className="absolute bottom-full left-0 right-0 p-2 bg-gray-800/50 rounded-t-lg">
                <div className="relative inline-block">
                  {attachment.mimeType.startsWith("image/") ? (
                    <img
                      src={attachment.content}
                      alt="preview"
                      className="h-24 w-auto rounded-lg"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                      <PaperclipIcon className="w-5 h-5 text-zinc-400" />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-zinc-200 truncate max-w-[150px]">
                          {attachment.fileName}
                        </span>
                        <span className="text-[10px] text-zinc-500 uppercase">
                          {attachment.mimeType.split("/")[1] || "FILE"}
                        </span>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setIsImagePreviewOpen(false);
                      setAttachment(null);
                    }}
                    className="absolute -top-2 -right-2 bg-zinc-900 rounded-full p-1 border border-zinc-700 hover:bg-zinc-800 transition shadow-lg"
                  >
                    <PlusIcon className="w-4 h-4 rotate-45 text-zinc-400" />
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
                  handleSendMessage(input.trim());
                }
              }}
              placeholder="Ask anything..."
              className="w-full bg-zinc-900/50 border border-zinc-700/50 focus:border-zinc-500/50 focus:ring-4 focus:ring-zinc-500/10 rounded-2xl p-4 pl-14 pr-16 text-zinc-100 placeholder-zinc-500 resize-none text-sm transition-all outline-none"
              style={{ minHeight: "56px" }}
            />
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileUpload}
            />
            <label
              htmlFor="file-upload"
              className="absolute left-3 bottom-[15px] p-2 bg-zinc-700/50 hover:bg-zinc-600/50 rounded-full cursor-pointer transition-all"
            >
              <PaperclipIcon className="w-5 h-5" />
            </label>
            <button
              onClick={() => voice.start()}
              disabled={isRecording || isGenerating}
              className={`absolute right-15  bottom-[15px]  p-2 rounded-full transition-all
    ${
      isRecording
        ? "bg-red-600 animate-pulse"
        : "bg-zinc-700/50 hover:bg-zinc-600/50"
    }`}
              title="Nói để nhập"
            >
              <MicIcon className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => handleSendMessage(input.trim())}
              disabled={!input.trim() || isGenerating}
              className={`absolute right-3  bottom-[15px]  p-2 bg-zinc-600 hover:bg-zinc-500 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-full transition-all ${
                input.trim() ? "shadow-lg shadow-zinc-500/20" : ""
              }`}
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
