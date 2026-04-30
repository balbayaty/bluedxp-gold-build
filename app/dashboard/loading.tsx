/**
 * Loading state for Dashboard
 * Shows during navigation to dashboard
 */
export default function DashboardLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <div className="text-white/70 text-sm">Loading dashboard...</div>
      </div>
    </div>
  );
}
