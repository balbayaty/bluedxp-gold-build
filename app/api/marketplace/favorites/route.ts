/**
 * Marketplace Favorites API
 * Manage user favorites, bookmarks, and saved searches
 */

import { NextRequest, NextResponse } from "next/server";
import { favoritesService } from "@/lib/services/marketplace/favoritesService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId") || "default-user"; // In production, get from auth
    const type = searchParams.get("type") || "listings"; // listings, providers, searches

    switch (type) {
      case "listings":
        const favoriteListings =
          await favoritesService.getFavoriteListings(userId);
        return NextResponse.json({
          success: true,
          data: favoriteListings,
          count: favoriteListings.length,
        });

      case "providers":
        const favoriteProviders =
          await favoritesService.getFavoriteProviders(userId);
        return NextResponse.json({
          success: true,
          data: favoriteProviders,
          count: favoriteProviders.length,
        });

      case "searches":
        const savedSearches = await favoritesService.getSavedSearches(userId);
        return NextResponse.json({
          success: true,
          data: savedSearches,
          count: savedSearches.length,
        });

      default:
        return NextResponse.json(
          { success: false, error: `Invalid type: ${type}` },
          { status: 400 },
        );
    }
  } catch (error: any) {
    console.error("Failed to get favorites:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get favorites" },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const {
      type,
      userId,
      listingId,
      providerId,
      name,
      query,
      filters,
      notes,
      tags,
    } = body;

    const actualUserId = userId || "default-user"; // In production, get from auth

    switch (type) {
      case "listing":
        if (!listingId) {
          return NextResponse.json(
            { success: false, error: "listingId is required" },
            { status: 400 },
          );
        }
        const favorite = await favoritesService.addFavoriteListing(
          actualUserId,
          listingId,
          notes,
          tags,
        );
        return NextResponse.json({ success: true, data: favorite });

      case "provider":
        if (!providerId) {
          return NextResponse.json(
            { success: false, error: "providerId is required" },
            { status: 400 },
          );
        }
        const favoriteProvider = await favoritesService.addFavoriteProvider(
          actualUserId,
          providerId,
          notes,
        );
        return NextResponse.json({ success: true, data: favoriteProvider });

      case "search":
        if (!name || !query) {
          return NextResponse.json(
            { success: false, error: "name and query are required" },
            { status: 400 },
          );
        }
        const savedSearch = await favoritesService.saveSearch(
          actualUserId,
          name,
          query,
          filters || {},
        );
        return NextResponse.json({ success: true, data: savedSearch });

      default:
        return NextResponse.json(
          { success: false, error: `Invalid type: ${type}` },
          { status: 400 },
        );
    }
  } catch (error: any) {
    console.error("Failed to add favorite:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add favorite" },
      { status: 500 },
    );
  }
}

async function deleteHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const userId = searchParams.get("userId") || "default-user";
    const listingId = searchParams.get("listingId");
    const providerId = searchParams.get("providerId");
    const searchId = searchParams.get("searchId");

    switch (type) {
      case "listing":
        if (!listingId) {
          return NextResponse.json(
            { success: false, error: "listingId is required" },
            { status: 400 },
          );
        }
        const removed = await favoritesService.removeFavoriteListing(
          userId,
          listingId,
        );
        return NextResponse.json({ success: true, removed });

      case "provider":
        if (!providerId) {
          return NextResponse.json(
            { success: false, error: "providerId is required" },
            { status: 400 },
          );
        }
        const removedProvider = await favoritesService.removeFavoriteProvider(
          userId,
          providerId,
        );
        return NextResponse.json({ success: true, removed: removedProvider });

      case "search":
        if (!searchId) {
          return NextResponse.json(
            { success: false, error: "searchId is required" },
            { status: 400 },
          );
        }
        const deleted = await favoritesService.deleteSavedSearch(searchId);
        return NextResponse.json({ success: true, deleted });

      default:
        return NextResponse.json(
          { success: false, error: `Invalid type: ${type}` },
          { status: 400 },
        );
    }
  } catch (error: any) {
    console.error("Failed to remove favorite:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to remove favorite" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.favorites",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.favorites",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const DELETE = withAPIGateway(deleteHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.favorites",
  action: "delete",
  requireAuth: true,
  rateLimit: true,
});
