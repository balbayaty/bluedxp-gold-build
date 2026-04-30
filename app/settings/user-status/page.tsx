"use client";

import { useAuth } from "@/contexts/AuthContext";
import {
  UserRole,
  getDefaultPermissions,
  ROLE_DEFINITIONS,
} from "@/types/user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";

export default function UserStatusPage() {
  const { user, isAuthenticated, isLoading, tenant } = useAuth();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Authenticated</AlertTitle>
          <AlertDescription>
            You are not currently logged in. Please log in to see your status.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isSystemAdmin = user.role === "SYSTEM_ADMIN";
  const roleDefinition = ROLE_DEFINITIONS[user.role as UserRole];
  const defaultPermissions = getDefaultPermissions(user.role as UserRole);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Authentication Status</h1>
        <p className="text-muted-foreground mt-2">
          View your current authentication status, role, and permissions
        </p>
      </div>

      {/* Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Authenticated
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                Not Authenticated
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* User Avatar and Main Info */}
            <div className="flex items-center gap-4 pb-4 border-b">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                {(() => {
                  const name = user.fullName || user.name || "";
                  const parts = name.split(" ").filter(Boolean);
                  if (parts.length >= 2) {
                    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
                  }
                  return name.slice(0, 2).toUpperCase() || "U";
                })()}
              </div>
              <div className="flex-1">
                <div className="text-xl font-bold">
                  {user.fullName || user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User"}
                </div>
                {user.kunya && (
                  <div className="flex items-center gap-2 text-cyan-500 font-medium mt-1">
                    <span className="text-sm">🌟</span>
                    {user.kunya}
                  </div>
                )}
                <div className="text-sm text-muted-foreground mt-1">
                  {user.email}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex justify-between p-2 rounded-lg bg-muted/30">
                <span className="font-medium">User ID:</span>
                <span className="text-muted-foreground text-sm">{user.id}</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-muted/30">
                <span className="font-medium">Email:</span>
                <span className="text-muted-foreground text-sm">{user.email}</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-muted/30">
                <span className="font-medium">Full Name:</span>
                <span className="text-muted-foreground text-sm">
                  {user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.name || "Not set"}
                </span>
              </div>
              {user.kunya && (
                <div className="flex justify-between p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                  <span className="font-medium text-cyan-600">Kunya:</span>
                  <span className="text-cyan-500 font-medium">{user.kunya}</span>
                </div>
              )}
              {user.displayName && (
                <div className="flex justify-between p-2 rounded-lg bg-muted/30">
                  <span className="font-medium">Display Name:</span>
                  <span className="text-muted-foreground text-sm">{user.displayName}</span>
                </div>
              )}
              {user.title && (
                <div className="flex justify-between p-2 rounded-lg bg-muted/30">
                  <span className="font-medium">Title:</span>
                  <span className="text-muted-foreground text-sm">{user.title}</span>
                </div>
              )}
              {tenant && (
                <div className="flex justify-between p-2 rounded-lg bg-muted/30">
                  <span className="font-medium">Organization:</span>
                  <span className="text-muted-foreground text-sm">{tenant.name}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Status */}
      <Card>
        <CardHeader>
          <CardTitle>Your Role</CardTitle>
          <CardDescription>Current role and access level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant={isSystemAdmin ? "default" : "secondary"}
                className={isSystemAdmin ? "bg-gradient-to-r from-red-500 to-orange-500 text-white border-0" : ""}
              >
                {roleDefinition?.name || user.role}
              </Badge>
              {isSystemAdmin && (
                <Badge
                  variant="outline"
                  className="border-amber-500 text-amber-600 bg-amber-50"
                >
                  ⭐ Full Platform Access
                </Badge>
              )}
              <Badge variant="outline" className="text-muted-foreground">
                {user.role}
              </Badge>
            </div>
            {roleDefinition && (
              <div className="space-y-3 pt-2">
                <div className="p-3 rounded-lg bg-muted/30">
                  <span className="font-medium block mb-1">Role Description:</span>
                  <span className="text-muted-foreground text-sm">
                    {roleDefinition.description}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <span className="font-medium block mb-2">Features Access:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {roleDefinition.features.slice(0, 8).map((feature, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {feature.replace(/_/g, " ")}
                      </Badge>
                    ))}
                    {roleDefinition.features.length > 8 && (
                      <Badge variant="outline" className="text-xs">
                        +{roleDefinition.features.length - 8} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Admin Alert */}
      {isSystemAdmin && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>System Administrator Access</AlertTitle>
          <AlertDescription>
            You are logged in as a <strong>SYSTEM_ADMIN</strong>. This role has
            full access to all modules, features, and system settings. You
            should be able to see and access everything in the platform.
          </AlertDescription>
        </Alert>
      )}

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Default Permissions</CardTitle>
          <CardDescription>
            Permissions granted to your role ({defaultPermissions.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {defaultPermissions.length > 0 ? (
              defaultPermissions.map((permission, index) => (
                <div key={index} className="p-3 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      {permission.moduleId || permission.resource}
                    </span>
                    <Badge variant="outline">{permission.scope}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {permission.actions.map((action, actionIndex) => (
                      <Badge
                        key={actionIndex}
                        variant="secondary"
                        className="text-xs"
                      >
                        {action}
                      </Badge>
                    ))}
                  </div>
                  {permission.featureId && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Feature: {permission.featureId}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No permissions defined for this role
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Permissions (if custom) */}
      {user.permissions && user.permissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Permissions</CardTitle>
            <CardDescription>
              Additional permissions assigned specifically to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {user.permissions.map((permission, index) => (
                <div key={index} className="p-3 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      {permission.moduleId || permission.resource}
                    </span>
                    <Badge variant="outline">{permission.scope}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {permission.actions.map((action, actionIndex) => (
                      <Badge
                        key={actionIndex}
                        variant="secondary"
                        className="text-xs"
                      >
                        {action}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
          <CardDescription>Common issues and solutions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">
                If you can't see features you developed:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>
                  Check if the feature requires specific module permissions (
                  {isSystemAdmin
                    ? "You have all permissions"
                    : "Your role may not have access"}
                  )
                </li>
                <li>
                  Verify the feature is registered in the module registry (
                  <code className="bg-muted px-1 rounded">
                    lib/modules/registry.ts
                  </code>
                  )
                </li>
                <li>
                  Check if there are permission checks in the component that
                  might be hiding it
                </li>
                <li>
                  Look for conditional rendering based on{" "}
                  <code className="bg-muted px-1 rounded">hasModuleAccess</code>{" "}
                  or{" "}
                  <code className="bg-muted px-1 rounded">
                    hasFeatureAccess
                  </code>
                </li>
                <li>Clear browser cache and localStorage, then log in again</li>
              </ul>
            </div>
            {!isSystemAdmin && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Limited Access</AlertTitle>
                <AlertDescription>
                  You are not logged in as SYSTEM_ADMIN. Some features may be
                  hidden based on your role permissions. If you need full access
                  for development, ensure you're logged in with a SYSTEM_ADMIN
                  account.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
