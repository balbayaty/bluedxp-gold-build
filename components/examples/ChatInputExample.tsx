"use client";

import React, { useState } from "react";
import { ModernIconButton } from "../ui/ModernIconButton";

/**
 * Example component showing the modern icon buttons in a chat interface
 * This demonstrates the "sexy modern" theme with sleek design
 */
export const ChatInputExample: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [message, setMessage] = useState("");

  const handleMicClick = () => {
    setIsRecording(!isRecording);
    // Add your voice recording logic here
  };

  const handleSendClick = () => {
    if (message.trim()) {
      // Add your send logic here
      console.log("Sending:", message);
      setMessage("");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      {/* Modern chat input container */}
      <div className="relative">
        {/* Input field with modern styling */}
        <div className="relative flex items-center gap-3 p-4 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/50 shadow-2xl">
          {/* Message input */}
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-sm"
            onKeyPress={(e) => {
              if (e.key === "Enter" && message.trim()) {
                handleSendClick();
              }
            }}
          />

          {/* Icon buttons container */}
          <div className="flex items-center gap-2">
            {/* Microphone button */}
            <ModernIconButton
              type="mic"
              onClick={handleMicClick}
              isActive={isRecording}
              size="md"
            />

            {/* Send button */}
            <ModernIconButton
              type="send"
              onClick={handleSendClick}
              isActive={!!message.trim()}
              disabled={!message.trim()}
              size="md"
            />
          </div>
        </div>

        {/* Subtle glow effect on focus */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-indigo-500/0 via-purple-500/0 to-pink-500/0 pointer-events-none transition-all duration-500 group-focus-within:from-indigo-500/10 group-focus-within:via-purple-500/10 group-focus-within:to-pink-500/10" />
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="mt-4 flex items-center gap-2 text-sm text-pink-400 animate-pulse">
          <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
          <span>Recording...</span>
        </div>
      )}
    </div>
  );
};
