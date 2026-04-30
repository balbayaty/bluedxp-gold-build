"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactPlayer from "react-player";
import { videoConfigs, getVideoThumbnail, VideoConfig } from "../config/videos";

export default function VideoShowcase() {
  const [selectedVideo, setSelectedVideo] = useState<VideoConfig | null>(null);
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);

  return (
    <div className="relative min-h-screen py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Video Showcase
            </span>
          </h2>
          <p className="text-xl text-[#9ca3af]">
            Watch our platform in action - Real demonstrations and walkthroughs
          </p>
        </motion.div>

        {/* Video Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {videoConfigs.map((video, index) => {
            const thumbnail = getVideoThumbnail(video);
            const isHovered = hoveredVideo === video.id;

            return (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative group cursor-pointer"
                onMouseEnter={() => setHoveredVideo(video.id)}
                onMouseLeave={() => setHoveredVideo(null)}
                onClick={() => setSelectedVideo(video)}
              >
                <div className="relative aspect-video bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-cyan-500/50 transition-all">
                  {/* Thumbnail Image */}
                  <div className="absolute inset-0">
                    <img
                      src={thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to gradient if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        if (target.parentElement) {
                          target.parentElement.style.background = `linear-gradient(135deg, ${getCategoryGradient(video.category)})`;
                        }
                      }}
                    />
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                  </div>

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={isHovered ? { scale: 1.2 } : { scale: 1 }}
                      className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border-2 border-white/30"
                    >
                      <i className="ri-play-fill text-4xl text-white ml-1"></i>
                    </motion.div>
                  </div>

                  {/* Video Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-semibold text-lg">
                        {video.title}
                      </h3>
                      <span className="text-xs text-[#9ca3af] bg-white/10 px-3 py-1 rounded">
                        {video.duration}
                      </span>
                    </div>
                    <p className="text-sm text-[#9ca3af] line-clamp-2">
                      {video.description}
                    </p>
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-4 right-4">
                    <span
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        video.category === "wms"
                          ? "bg-cyan-500/20 text-cyan-400"
                          : video.category === "hazalyze"
                            ? "bg-purple-500/20 text-purple-400"
                            : video.category === "aivision"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {video.category.toUpperCase()}
                    </span>
                  </div>

                  {/* Hover Effect Glow */}
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        boxShadow: `0 0 40px ${getCategoryColor(video.category)}40`,
                      }}
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Video Modal */}
        <AnimatePresence>
          {selectedVideo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
              onClick={() => setSelectedVideo(null)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative max-w-5xl w-full bg-[#1f2937] rounded-2xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors backdrop-blur-sm"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>

                {/* Video Player */}
                <div className="aspect-video bg-black">
                  <ReactPlayer
                    url={selectedVideo.url}
                    width="100%"
                    height="100%"
                    controls
                    playing
                    config={{
                      youtube: {
                        playerVars: {
                          autoplay: 1,
                          rel: 0,
                          modestbranding: 1,
                        },
                      },
                      vimeo: {
                        playerOptions: {
                          autoplay: true,
                          responsive: true,
                        },
                      },
                    }}
                  />
                </div>

                {/* Video Info */}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        selectedVideo.category === "wms"
                          ? "bg-cyan-500/20 text-cyan-400"
                          : selectedVideo.category === "hazalyze"
                            ? "bg-purple-500/20 text-purple-400"
                            : selectedVideo.category === "aivision"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {selectedVideo.category.toUpperCase()}
                    </span>
                    <span className="text-sm text-[#9ca3af]">
                      {selectedVideo.duration}
                    </span>
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-2">
                    {selectedVideo.title}
                  </h3>
                  <p className="text-[#9ca3af]">{selectedVideo.description}</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions for Adding Videos */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <i className="ri-information-line text-cyan-400"></i>
            How to Add Your Videos
          </h3>
          <div className="space-y-3 text-sm text-[#9ca3af]">
            <div className="flex items-start gap-3">
              <i className="ri-youtube-line text-red-400 mt-0.5"></i>
              <div>
                <div className="text-white font-medium mb-1">
                  YouTube Videos:
                </div>
                <div>
                  Edit{" "}
                  <code className="bg-white/10 px-2 py-1 rounded text-cyan-400">
                    app/showcase/config/videos.ts
                  </code>{" "}
                  and add your YouTube video URLs
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <i className="ri-vimeo-line text-blue-400 mt-0.5"></i>
              <div>
                <div className="text-white font-medium mb-1">Vimeo Videos:</div>
                <div>Add Vimeo URLs in the same config file</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <i className="ri-file-video-line text-green-400 mt-0.5"></i>
              <div>
                <div className="text-white font-medium mb-1">
                  Local Video Files:
                </div>
                <div>
                  Place videos in{" "}
                  <code className="bg-white/10 px-2 py-1 rounded text-cyan-400">
                    public/videos/
                  </code>{" "}
                  folder and reference them as{" "}
                  <code className="bg-white/10 px-2 py-1 rounded text-cyan-400">
                    /videos/your-video.mp4
                  </code>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Helper functions
function getCategoryColor(category: string): string {
  switch (category) {
    case "wms":
      return "#06b6d4";
    case "hazalyze":
      return "#8b5cf6";
    case "aivision":
      return "#10b981";
    case "integration":
      return "#3b82f6";
    default:
      return "#06b6d4";
  }
}

function getCategoryGradient(category: string): string {
  switch (category) {
    case "wms":
      return "#06b6d4, #0891b2";
    case "hazalyze":
      return "#8b5cf6, #7c3aed";
    case "aivision":
      return "#10b981, #059669";
    case "integration":
      return "#3b82f6, #2563eb";
    default:
      return "#06b6d4, #0891b2";
  }
}
