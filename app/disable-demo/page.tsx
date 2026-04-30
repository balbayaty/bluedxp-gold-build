"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DisableDemoPage() {
  const router = useRouter();

  useEffect(() => {
    // Disable demo mode
    localStorage.removeItem('demo-mode');
    localStorage.removeItem('current-user');
    localStorage.removeItem('current-tenant');
    console.log('✅ Demo mode disabled');
    console.log('✅ Cleared cached user data');
    
    // Redirect to login
    router.push('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e14] via-[#0f1419] to-[#0a0e14] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-white text-lg">Disabling Demo Mode...</p>
        <p className="text-[#9ca3af] text-sm mt-2">Redirecting to login...</p>
        <p className="text-[#6b7280] text-xs mt-4">You'll need database credentials to login</p>
      </div>
    </div>
  );
}
