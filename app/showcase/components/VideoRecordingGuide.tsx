"use client";

import { motion } from "framer-motion";

export default function VideoRecordingGuide() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8"
    >
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <i className="ri-video-line text-cyan-400"></i>
        How to Create a Video from the Animation
      </h3>

      <div className="space-y-4 text-sm text-[#9ca3af]">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-cyan-400 font-bold text-xs">1</span>
          </div>
          <div>
            <div className="text-white font-medium mb-1">
              Use the Record Button
            </div>
            <div>
              Click the "Record Video" button above. Your browser will ask for
              screen sharing permission. Select the browser tab/window
              containing the animation.
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-cyan-400 font-bold text-xs">2</span>
          </div>
          <div>
            <div className="text-white font-medium mb-1">
              Play the Animation
            </div>
            <div>
              The animation will start playing automatically. Use the play/pause
              controls and speed settings to customize the recording.
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-cyan-400 font-bold text-xs">3</span>
          </div>
          <div>
            <div className="text-white font-medium mb-1">Stop Recording</div>
            <div>
              When finished, click "Stop Recording". The video will appear below
              and you can download it as a .webm file.
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-cyan-400 font-bold text-xs">4</span>
          </div>
          <div>
            <div className="text-white font-medium mb-1">
              Add to Video Showcase
            </div>
            <div>
              <ol className="list-decimal list-inside space-y-1 mt-1">
                <li>Download the video file</li>
                <li>
                  Convert to MP4 if needed (use online converter or FFmpeg)
                </li>
                <li>
                  Place it in{" "}
                  <code className="bg-white/10 px-2 py-1 rounded text-cyan-400">
                    public/videos/
                  </code>{" "}
                  folder
                </li>
                <li>
                  Update{" "}
                  <code className="bg-white/10 px-2 py-1 rounded text-cyan-400">
                    app/showcase/config/videos.ts
                  </code>{" "}
                  with the video path
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <div className="flex items-start gap-2">
          <i className="ri-information-line text-yellow-400 mt-0.5"></i>
          <div className="text-sm text-yellow-200">
            <strong>Tip:</strong> For best quality, record in full screen mode
            and use 1x speed. The video will be saved as WebM format. You can
            convert it to MP4 using online tools like CloudConvert or FFmpeg.
          </div>
        </div>
      </div>
    </motion.div>
  );
}
