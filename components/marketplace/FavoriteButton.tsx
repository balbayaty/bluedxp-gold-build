"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

interface FavoriteButtonProps {
  userId: string;
  listingId?: string;
  providerId?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function FavoriteButton({
  userId,
  listingId,
  providerId,
  size = "md",
  className = "",
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkFavoriteStatus();
  }, [userId, listingId, providerId]);

  const checkFavoriteStatus = async () => {
    if (!listingId && !providerId) return;

    try {
      const type = listingId ? "listing" : "provider";
      const id = listingId || providerId;
      const response = await fetch(
        `/api/marketplace/favorites?userId=${userId}&type=${type}&${type}Id=${id}`,
      );
      const result = await response.json();
      if (result.success) {
        setIsFavorited(result.isFavorited || false);
      }
    } catch (error) {
      console.error("Failed to check favorite status:", error);
    }
  };

  const toggleFavorite = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const type = listingId ? "listing" : "provider";
      const id = listingId || providerId;

      if (isFavorited) {
        // Remove from favorites
        const response = await fetch(
          `/api/marketplace/favorites?type=${type}&userId=${userId}&${type}Id=${id}`,
          {
            method: "DELETE",
          },
        );
        const result = await response.json();
        if (result.success) {
          setIsFavorited(false);
        }
      } else {
        // Add to favorites
        const response = await fetch("/api/marketplace/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            userId,
            [type === "listing" ? "listingId" : "providerId"]: id,
          }),
        });
        const result = await response.json();
        if (result.success) {
          setIsFavorited(true);
        }
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`${className} ${sizeClasses[size]} transition-all hover:scale-110 ${
        isFavorited
          ? "text-red-500 fill-red-500"
          : "text-slate-400 hover:text-red-500"
      }`}
      title={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart className={`w-full h-full ${isFavorited ? "fill-current" : ""}`} />
    </button>
  );
}
