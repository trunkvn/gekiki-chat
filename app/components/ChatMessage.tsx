import React, { memo } from "react";
import { Message, Role } from "../types";
import { PaperclipIcon } from "./Icons";
import Markdown from "./Markdown";

const ChatMessage: React.FC<{
  message: Message;
  onImageClick?: (src: string) => void;
}> = ({ message, onImageClick }) => {
  const isUser = message.role === Role.USER;

  return (
    <div
      className={`flex w-full mb-6 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex max-w-[85%] md:max-w-[75%] ${
          isUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <div
          className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
        >
          <div
            className={`p-3.5 rounded-2xl leading-relaxed max-w-[550px] ${
              isUser
                ? "bg-indigo-800 text-white rounded-tr-none"
                : "bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-none"
            }`}
          >
            {message.attachment && (
              message.attachment.mimeType.startsWith("image/") ? (
                <img
                  src={message.attachment.content}
                  alt="uploaded"
                  onClick={() => onImageClick?.(message.attachment?.content || "")}
                  className="rounded-xl max-w-xs mt-2 cursor-zoom-in hover:opacity-90 transition"
                />
              ) : (
                <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl mt-2 max-w-xs border border-zinc-700/50">
                  <div className="p-2 bg-zinc-800 rounded-lg">
                     <PaperclipIcon className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate text-zinc-200">
                      {message.attachment.fileName || "File Attachment"}
                    </span>
                    <span className="text-[10px] text-zinc-500 uppercase">
                      {message.attachment.mimeType.split("/")[1] || "FILE"}
                    </span>
                  </div>
                </div>
              )
            )}
            <Markdown content={message.content} />
          </div>

          <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold px-1">
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default memo(ChatMessage);
