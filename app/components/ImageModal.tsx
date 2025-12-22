"use client";

import { useEffect } from "react";
import { PlusIcon } from "./Icons";

interface Props {
  src: string;
  onClose: () => void;
}

export default function ImageModal({ src, onClose }: Props) {
  // Close bằng ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 rounded-full p-2"
      >
        <PlusIcon className="w-5 h-5 rotate-45 text-white" />
      </button>

      <img
        src={src}
        alt="preview"
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
      />
    </div>
  );
}
