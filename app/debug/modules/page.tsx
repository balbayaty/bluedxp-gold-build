"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ModuleInfo {
  id: string;
  name: string;
  description?: string;
  category?: string;
  routes: Array<{ path: string; title: string; icon?: string }>;
  capabilities: {
    routes: number;
    components: number;
    services: number;
    features: string[];
  };
}

export default function ModulesDebugPage() {
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await fetch("/api/modules/list", {
          credentials: "include",
        });
        const json = await res.json();

        if (json.success && Array.isArray(json.data)) {
          setModules(json.data);
        } else {
          setError(json.error || "Failed to load modules");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Module Debug Page</h1>
        <p>Loading modules...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Module Debug Page</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Module Debug Page</h1>
        <p className="text-muted-foreground">
          Total Modules: <strong>{modules.length}</strong>
        </p>
      </div>

      <div className="grid gap-4">
        {modules.map((module) => (
          <Card key={module.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{module.name}</CardTitle>
                  <CardDescription>
                    {module.description || "No description"}
                  </CardDescription>
                </div>
                <Badge variant="default">{module.category || "general"}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex gap-4 text-sm">
                  <span>
                    <strong>Routes:</strong> {module.capabilities.routes}
                  </span>
                  <span>
                    <strong>Components:</strong>{" "}
                    {module.capabilities.components}
                  </span>
                  <span>
                    <strong>Services:</strong> {module.capabilities.services}
                  </span>
                </div>

                {module.routes.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Routes:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {module.routes.map((route, idx) => (
                        <div
                          key={idx}
                          className="text-sm p-2 bg-muted rounded border"
                        >
                          <div className="font-medium">{route.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {route.path}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {modules.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No modules found. Check the console for errors.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
