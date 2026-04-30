import { NextResponse } from "next/server";
// Ensure modules are registered before reading from the registry.
// This import has side-effects (registerModule calls) and is safe on the server.
import "@/lib/modules";
import { moduleRegistry } from "@/lib/modules/registry";

// Force dynamic rendering - never cache module list
// This ensures developers always see the latest registered modules
export const dynamic = "force-dynamic";
export const revalidate = 0; // Never cache - always fresh data

export async function GET() {
  try {
    // Ensure modules are registered
    const allModules = moduleRegistry.getAllModules();
    const enabledModules = moduleRegistry.getEnabledModules();

    console.log(
      `[API] /api/modules/list - Total modules: ${allModules.length}, Enabled: ${enabledModules.length}`,
    );

    // For "All Modules" view, show ALL registered modules that are enabled
    // Use getAllModules() and filter manually to catch any registration issues
    const modulesToShow = allModules.filter((m) => {
      // Check if module is explicitly enabled
      const isExplicitlyEnabled = m.enabled !== false;

      if (!isExplicitlyEnabled) {
        console.log(
          `[API] Module "${m.name}" (${m.id}) is explicitly disabled, skipping`,
        );
        return false;
      }

      // If module is enabled but not in enabled set, try to add it
      const isInEnabledSet = moduleRegistry.isModuleEnabled(m.id);
      if (!isInEnabledSet) {
        console.warn(
          `[API] WARNING: Module "${m.name}" (${m.id}) is marked enabled but not in enabled set! Fixing...`,
        );
        try {
          // Check dependencies first
          const missingDeps =
            m.dependencies?.filter(
              (dep) => !moduleRegistry.isModuleEnabled(dep),
            ) || [];
          if (missingDeps.length > 0) {
            console.warn(
              `[API] Module "${m.name}" has missing dependencies: ${missingDeps.join(", ")} - will show anyway for visibility`,
            );
          }
          moduleRegistry.enableModule(m.id);
        } catch (e) {
          // If enabling fails due to dependencies, show it anyway for visibility
          console.warn(
            `[API] Could not enable module ${m.id} automatically, but will show it:`,
            e,
          );
        }
      }

      return true;
    });

    console.log(
      `[API] Showing ${modulesToShow.length} modules (out of ${allModules.length} total registered)`,
    );

    // Transform modules to include detailed info for the dropdown
    const moduleList = modulesToShow.map((module) => {
      // Get routes from module definition
      const routes = module.routes || [];
      const staticRoutes = routes.filter((r) => !r.path.includes("["));
      const dynamicRoutes = routes.filter((r) => r.path.includes("["));

      console.log(
        `[API] Module "${module.name}" (${module.id}): ${routes.length} total routes (${staticRoutes.length} static, ${dynamicRoutes.length} dynamic)`,
      );

      return {
        id: module.id,
        name: module.name,
        description: module.description || `${module.name} module`,
        category: module.category || "general",
        routes: routes.map((route) => ({
          path: route.path,
          title: route.title || route.path,
          icon: route.icon,
        })),
        capabilities: {
          routes: routes.length,
          staticRoutes: staticRoutes.length,
          dynamicRoutes: dynamicRoutes.length,
          components: Array.isArray(module.components)
            ? module.components.length
            : 0,
          services:
            typeof module.services === "object" &&
            module.services !== null &&
            !Array.isArray(module.services)
              ? Object.keys(module.services).length
              : Array.isArray(module.services)
                ? module.services.length
                : 0,
          features: routes.map((r) => r.title || r.path),
        },
      };
    });

    console.log(
      `[API] Returning ${moduleList.length} modules to client (all enabled modules, regardless of route count)`,
    );
    console.log(
      `[API] Module list:`,
      moduleList
        .map((m) => `${m.name} (${m.id}) - ${m.capabilities.routes} routes`)
        .join(", "),
    );

    if (moduleList.length === 0) {
      console.error(
        "[API] ERROR: No modules to return! This indicates a serious registration issue.",
      );
      console.error("[API] Total registered modules:", allModules.length);
      console.error("[API] Enabled modules in set:", enabledModules.length);
    } else if (moduleList.length === 1) {
      console.warn(
        `[API] WARNING: Only 1 module returned! Expected ${allModules.length}+ modules.`,
      );
      console.warn(
        `[API] This might indicate modules aren't being registered or enabled properly.`,
      );
    }

    return NextResponse.json({
      success: true,
      data: moduleList,
      meta: {
        total: allModules.length,
        enabled: enabledModules.length,
        returned: moduleList.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[API] List modules error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to list modules",
        data: [],
      },
      { status: 500 },
    );
  }
}
