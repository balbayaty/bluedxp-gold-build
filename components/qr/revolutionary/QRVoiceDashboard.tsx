"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function QRVoiceDashboard() {
  const [isListening, setIsListening] = useState(false);
  const [command, setCommand] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    setIsListening(true);
    // In production, use Web Speech API or external service
    setTimeout(() => {
      setCommand("Generate QR code for MSDS 12345");
      setIsListening(false);
    }, 2000);
  };

  const stopListening = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      // recognitionRef.current.stop()
    }
  };

  const processCommand = async () => {
    if (!command) return;

    setIsProcessing(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/qr/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "process-command",
          command,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResponse(data.response);
        setHistory((prev) =>
          [
            { command, response: data.response, timestamp: new Date() },
            ...prev,
          ].slice(0, 10),
        );
        setCommand(""); // Clear input
      } else {
        setError(data.error || "Failed to process command");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to process command";
      setError(errorMessage);
      console.error("Error processing command:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const exampleCommands = [
    "Generate QR code for MSDS 12345",
    "Search for QR codes in Riyadh",
    "Show analytics for QR code ABC123",
    "Find all QR codes related to chemicals",
    "Create QR network for supply chain",
  ];

  return (
    <div className="space-y-6">
      {/* Voice Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700"
      >
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <i className="ri-mic-line text-green-400"></i>
          Voice Control
        </h2>

        {/* Voice Button */}
        <div className="flex items-center gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={isListening ? stopListening : startListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl ${
              isListening
                ? "bg-red-500 animate-pulse"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            <i className={isListening ? "ri-stop-line" : "ri-mic-line"}></i>
          </motion.button>
          <div className="flex-1">
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Or type your command here..."
              className="w-full px-4 py-3 bg-gray-900 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
            />
          </div>
          <button
            onClick={processCommand}
            disabled={isProcessing || !command}
            className="px-6 py-3 bg-green-500 rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing..." : "Execute"}
          </button>
        </div>

        {/* Status */}
        {isListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-green-400 mb-4"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 bg-green-400 rounded-full"
            />
            Listening...
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 mb-4"
          >
            <div className="flex items-center gap-2 text-red-400">
              <i className="ri-error-warning-line"></i>
              <div>{error}</div>
            </div>
          </motion.div>
        )}

        {/* Processing */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-blue-400 mb-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"
            />
            Processing command...
          </motion.div>
        )}

        {/* Response */}
        {response && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900/50 rounded-lg p-4 border border-green-500/30"
          >
            <div className="text-sm text-gray-400 mb-2">Response:</div>
            <div className="text-green-400">{response.text}</div>
            {response.actions && response.actions.length > 0 && (
              <div className="mt-4 flex gap-2">
                {response.actions.map((action: any, idx: number) => (
                  <button
                    key={idx}
                    className="px-3 py-1 bg-green-500/20 rounded text-sm hover:bg-green-500/30 transition"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Example Commands */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700"
      >
        <h3 className="font-bold mb-4">Example Commands</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {exampleCommands.map((cmd, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.02, x: 5 }}
              onClick={() => {
                setCommand(cmd);
                processCommand();
              }}
              className="text-left px-4 py-3 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-green-500/50 transition text-sm"
            >
              <i className="ri-command-line mr-2 text-green-400"></i>
              {cmd}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Command History */}
      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700"
        >
          <h3 className="font-bold mb-4">Recent Commands</h3>
          <div className="space-y-2">
            {history.map((item, idx) => (
              <div key={idx} className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-sm text-gray-400 mb-1">
                  {item.timestamp.toLocaleTimeString()}
                </div>
                <div className="text-green-400 mb-2">{item.command}</div>
                <div className="text-sm text-gray-300">
                  {item.response.text}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
