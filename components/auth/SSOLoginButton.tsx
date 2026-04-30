/**
 * 🔐 SSO LOGIN BUTTON COMPONENT
 * 
 * Login with SSO providers:
 * - Display available providers
 * - Initiate SSO flow
 * - Handle errors
 * 
 * BlueDXP Platform - Enterprise Grade
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface SSOProvider {
  id: string;
  name: string;
  type: "saml" | "oidc";
  enabled: boolean;
}

interface SSOLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const getProviderIcon = (name: string): string => {
  const nameLower = name.toLowerCase();
  if (nameLower.includes("microsoft") || nameLower.includes("azure")) {
    return "ri-microsoft-fill";
  }
  if (nameLower.includes("google")) {
    return "ri-google-fill";
  }
  if (nameLower.includes("okta")) {
    return "ri-shield-check-line";
  }
  if (nameLower.includes("github")) {
    return "ri-github-fill";
  }
  if (nameLower.includes("apple")) {
    return "ri-apple-fill";
  }
  return "ri-key-2-line";
};

const getProviderColor = (name: string): string => {
  const nameLower = name.toLowerCase();
  if (nameLower.includes("microsoft") || nameLower.includes("azure")) {
    return "from-blue-600 to-blue-700";
  }
  if (nameLower.includes("google")) {
    return "from-red-500 to-red-600";
  }
  if (nameLower.includes("okta")) {
    return "from-indigo-500 to-indigo-600";
  }
  if (nameLower.includes("github")) {
    return "from-gray-700 to-gray-800";
  }
  if (nameLower.includes("apple")) {
    return "from-gray-900 to-black";
  }
  return "from-purple-500 to-purple-600";
};

const SSOLoginButton: React.FC<SSOLoginButtonProps> = ({ onSuccess, onError }) => {
  const [providers, setProviders] = useState<SSOProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState<string | null>(null);

  // Fetch available SSO providers
  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch("/api/auth/sso/available");
      
      if (response.ok) {
        const result = await response.json();
        setProviders(result.data?.filter((p: SSOProvider) => p.enabled) || []);
      } else {
        // Use mock data for demo
        setProviders([
          { id: "sso_azure", name: "Microsoft Azure AD", type: "saml", enabled: true },
          { id: "sso_google", name: "Google Workspace", type: "oidc", enabled: true },
        ]);
      }
    } catch (error) {
      // Use mock data
      setProviders([
        { id: "sso_azure", name: "Microsoft Azure AD", type: "saml", enabled: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initiate SSO login
  const handleLogin = async (providerId: string) => {
    setLoggingIn(providerId);
    
    try {
      const response = await fetch(`/api/auth/sso/login?provider=${providerId}`, {
        method: "POST",
      });

      const result = await response.json();

      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        throw new Error(result.error || "Failed to initiate SSO");
      }
    } catch (error: any) {
      console.error("SSO login failed:", error);
      onError?.(error.message);
      setLoggingIn(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-12 bg-white/10 rounded-xl"></div>
      </div>
    );
  }

  if (providers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-white/10"></div>
        <span className="text-xs text-[#6b7280]">or continue with</span>
        <div className="flex-1 h-px bg-white/10"></div>
      </div>

      {/* SSO Buttons */}
      <div className="space-y-2">
        {providers.map((provider) => (
          <motion.button
            key={provider.id}
            onClick={() => handleLogin(provider.id)}
            disabled={loggingIn !== null}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full px-4 py-3 rounded-xl text-white font-medium flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${getProviderColor(provider.name)}`}
          >
            {loggingIn === provider.id ? (
              <>
                <i className="ri-loader-4-line animate-spin text-lg"></i>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <i className={`${getProviderIcon(provider.name)} text-lg`}></i>
                <span>Continue with {provider.name}</span>
              </>
            )}
          </motion.button>
        ))}
      </div>

      {/* SSO Info */}
      <p className="text-center text-xs text-[#6b7280]">
        <i className="ri-shield-check-line mr-1"></i>
        Enterprise Single Sign-On
      </p>
    </div>
  );
};

export default SSOLoginButton;
