/**
 * Loading state for Shipments
 */
export default function ShipmentsLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <div className="text-white/70 text-sm">Loading shipments...</div>
      </div>
    </div>
  );
}
