/**
 * Empty State Component
 * Consistent empty state UI across intelligence pages
 */

"use client";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
      <i className={`${icon} text-6xl text-[#9ca3af] mb-4`}></i>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-[#9ca3af] mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
        >
          <i className="ri-play-line mr-2"></i>
          {action.label}
        </button>
      )}
    </div>
  );
}
