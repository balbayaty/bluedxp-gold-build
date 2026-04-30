/**
 * AI Document Processor - Convert Documents to Processes
 * Upload any document and automatically extract and visualize the process
 */

"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import ErrorBoundary from "@/components/ErrorBoundary";

interface ProcessResult {
  parsed: {
    id: string;
    filename: string;
    type: string;
    wordCount: number;
  };
  extracted: {
    id: string;
    name: string;
    description: string;
    type: string;
    stepsCount: number;
    actors: string[];
    confidence: number;
  };
  visualization: {
    nodes: any[];
    edges: any[];
    layout: string;
  };
  workflow: any;
}

export default function DocumentProcessorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useAI, setUseAI] = useState(true);
  const [processType, setProcessType] = useState<string>("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        [".pptx"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tiff"],
    },
    maxFiles: 1,
  });

  const handleProcess = async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("useAI", useAI.toString());
      if (processType) {
        formData.append("processType", processType);
      }

      const response = await fetch("/api/ai-document-processor/process", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || "Failed to process document");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveWorkflow = async () => {
    if (!result) return;

    try {
      const response = await fetch("/api/process-lifecycle/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          workflowData: result.workflow,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Will be handled by parent component's notification system
        // Redirect to workflows page
        window.location.href = "/process-lifecycle/workflows";
      } else {
        // Will be handled by parent component's notification system
        console.error("Failed to save workflow:", data.error);
      }
    } catch (err) {
      console.error("Error saving workflow:", err);
    }
  };

  // Convert visualization to React Flow format
  const reactFlowNodes: Node[] =
    result?.visualization?.nodes.map((node: any) => ({
      id: node.id,
      type: node.type === "decision" ? "default" : "default",
      position: node.position || { x: 0, y: 0 },
      data: { label: node.label },
    })) || [];

  const reactFlowEdges: Edge[] =
    result?.visualization?.edges.map((edge: any) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      animated: true,
    })) || [];

  return (
    <ErrorBoundary
      fallback={
        <div className="text-red-400 p-4">Error loading Document Processor</div>
      }
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <i className="ri-file-upload-line text-purple-400"></i>
            AI Document Processor
          </h1>
          <p className="text-[#9ca3af] text-lg">
            Upload any document (PDF, Word, Excel, Image, etc.) and
            automatically extract and visualize the process
          </p>
        </div>

        {/* Upload Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Upload Document
            </h2>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-white/20 hover:border-purple-500/50"
              }`}
            >
              <input {...getInputProps()} />
              <i className="ri-file-upload-line text-4xl text-purple-400 mb-4"></i>
              {file ? (
                <div>
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-sm text-[#9ca3af] mt-2">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-white mb-2">
                    Drag & drop a file here, or click to select
                  </p>
                  <p className="text-sm text-[#9ca3af]">
                    Supports: PDF, Word, Excel, PowerPoint, Images, Text,
                    Markdown
                  </p>
                </div>
              )}
            </div>

            {/* Options */}
            <div className="mt-6 space-y-4">
              <div>
                <label className="flex items-center gap-2 text-white mb-2">
                  <input
                    type="checkbox"
                    checked={useAI}
                    onChange={(e) => setUseAI(e.target.checked)}
                    className="rounded"
                  />
                  <span>Use AI (GPT-4) for extraction (more accurate)</span>
                </label>
                {!useAI && (
                  <p className="text-xs text-[#9ca3af] ml-6">
                    Uses pattern matching (faster but less accurate)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-white mb-2">
                  Process Type (optional)
                </label>
                <select
                  value={processType}
                  onChange={(e) => setProcessType(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="">Auto-detect</option>
                  <option value="workflow">Workflow</option>
                  <option value="procedure">Procedure</option>
                  <option value="checklist">Checklist</option>
                  <option value="approval-process">Approval Process</option>
                  <option value="data-processing">Data Processing</option>
                  <option value="integration">Integration</option>
                  <option value="compliance">Compliance</option>
                </select>
              </div>

              <button
                onClick={handleProcess}
                disabled={!file || processing}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="ri-magic-line"></i>
                    Extract Process
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Preview */}
          {result && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Extracted Process
              </h2>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Process Name
                  </div>
                  <div className="text-white font-semibold">
                    {result.extracted.name}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">Description</div>
                  <div className="text-white text-sm">
                    {result.extracted.description}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-[#9ca3af] mb-1">Type</div>
                    <div className="text-white font-medium">
                      {result.extracted.type}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-[#9ca3af] mb-1">Steps</div>
                    <div className="text-white font-medium">
                      {result.extracted.stepsCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-[#9ca3af] mb-1">
                      Confidence
                    </div>
                    <div className="text-white font-medium">
                      {(result.extracted.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-[#9ca3af] mb-1">Actors</div>
                    <div className="text-white font-medium">
                      {result.extracted.actors.length}
                    </div>
                  </div>
                </div>

                {result.extracted.actors.length > 0 && (
                  <div>
                    <div className="text-sm text-[#9ca3af] mb-2">Actors</div>
                    <div className="flex flex-wrap gap-2">
                      {result.extracted.actors.map((actor, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs"
                        >
                          {actor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSaveWorkflow}
                  className="w-full px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg text-sm font-medium transition-colors"
                >
                  <i className="ri-save-line mr-2"></i>
                  Save as Workflow
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-400">
              <i className="ri-error-warning-line"></i>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Visualization */}
        {result && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Process Visualization
            </h2>
            <div className="h-[600px] bg-[#0a0a0a] rounded-lg">
              <ReactFlow nodes={reactFlowNodes} edges={reactFlowEdges} fitView>
                <Background />
                <Controls />
                <MiniMap />
              </ReactFlow>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
