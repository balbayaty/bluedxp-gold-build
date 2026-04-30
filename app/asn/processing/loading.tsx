/**
 * ASN Processing List Loading State
 */

export default function ProcessingLoading() {
  return (
    <div className="container mx-auto py-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  );
}
