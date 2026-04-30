/**
 * Message Composer Component
 * Input field for sending messages with file attachments
 */

"use client";

import { useState, useRef } from "react";
import { Send, Paperclip, Image, X } from "lucide-react";
import { motion } from "framer-motion";

interface MessageComposerProps {
  onSend: (content: string, attachments?: any[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function MessageComposer({
  onSend,
  disabled = false,
  placeholder = "Type a message...",
}: MessageComposerProps) {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (content.trim() || attachments.length > 0) {
      onSend(content, attachments);
      setContent("");
      setAttachments([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type,
            size: file.size,
            data: reader.result,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              type: file.type,
              size: file.size,
              data: reader.result,
            },
          ]);
        };
        reader.readAsDataURL(file);
      }
    });
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group"
            >
              {att.type.startsWith("image/") ? (
                <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600">
                  <img
                    src={att.data}
                    alt={att.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600">
                  <p className="text-xs truncate max-w-[100px]">{att.name}</p>
                  <p className="text-xs text-slate-500">
                    {(att.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}
              <button
                onClick={() => removeAttachment(idx)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition"
            style={{ minHeight: "48px", maxHeight: "120px" }}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* File Attachment */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept="*/*"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition disabled:opacity-50"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>

          {/* Image Attachment */}
          <input
            ref={imageInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleImageSelect}
            accept="image/*"
          />
          <button
            onClick={() => imageInputRef.current?.click()}
            disabled={disabled}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition disabled:opacity-50"
            title="Attach image"
          >
            <Image className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={disabled || (!content.trim() && attachments.length === 0)}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
