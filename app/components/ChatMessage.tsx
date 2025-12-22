import React, { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message, Role } from "../types";
import { UserIcon, RobotIcon } from "./Icons";
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
          className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
            isUser ? "bg-indigo-800 ml-3" : "bg-slate-700 mr-3"
          }`}
        >
          {isUser ? (
            <UserIcon className="w-5 h-5 text-white" />
          ) : (
            <RobotIcon className="w-5 h-5 text-indigo-400" />
          )}
        </div>

        <div
          className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
        >
          <div
            className={`p-4 rounded-2xl whitespace-pre-wrap leading-relaxed max-w-[550px] ${
              isUser
                ? "bg-indigo-800 text-white rounded-tr-none"
                : "bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-none"
            }`}
          >
            {message.imageBase64 && (
              <img
                src={message.imageBase64}
                alt="uploaded"
                onClick={() => onImageClick?.(message.imageBase64!)}
                className="rounded-xl max-w-xs mt-2 cursor-zoom-in hover:opacity-90 transition"
              />
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
