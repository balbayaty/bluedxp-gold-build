/**
 * Root loading component for BlueDXP Platform
 * Shows a non-blocking loading state during page navigation
 * This improves perceived performance during route transitions
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500/20 rounded-full"></div>
        </div>
        <div className="text-white/70 text-sm mt-4">Loading...</div>
      </div>
    </div>
  );
}
