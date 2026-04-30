"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DemoLoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Enable demo mode
    localStorage.setItem('demo-mode', 'true');
    console.log('✅ Demo mode enabled');
    
    // Redirect to login
    router.push('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e14] via-[#0f1419] to-[#0a0e14] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#05a4ff] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-white text-lg">Enabling Demo Mode...</p>
        <p className="text-[#9ca3af] text-sm mt-2">Redirecting to login...</p>
      </div>
    </div>
  );
}
