/**
 * 🔐 SSO SERVICE
 * 
 * Single Sign-On with:
 * - SAML 2.0
 * - OIDC/OAuth2
 * - Provider configuration
 * - Attribute mapping
 * 
 * BlueDXP Platform - Enterprise Grade
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SSOProvider {
  id: string;
  name: string;
  type: "saml" | "oidc" | "oauth2";
  enabled: boolean;
  config: SAMLConfig | OIDCConfig;
  attributeMapping: AttributeMapping;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface SAMLConfig {
  entityId: string;
  ssoUrl: string;
  sloUrl?: string;
  certificate: string;
  signatureAlgorithm: "RSA-SHA256" | "RSA-SHA1";
  digestAlgorithm: "SHA256" | "SHA1";
  wantAssertionsSigned: boolean;
  wantResponseSigned: boolean;
  nameIdFormat: "emailAddress" | "unspecified" | "persistent" | "transient";
}

export interface OIDCConfig {
  clientId: string;
  clientSecret: string;
  issuer: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  jwksUrl?: string;
  scopes: string[];
  responseType: "code" | "id_token" | "token";
}

export interface AttributeMapping {
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  department?: string;
  role?: string;
  groups?: string;
}

export interface SSOSession {
  id: string;
  userId: string;
  providerId: string;
  providerUserId: string;
  attributes: Record<string, any>;
  createdAt: Date | string;
  expiresAt: Date | string;
}

// ============================================================================
// SSO SERVICE
// ============================================================================

export const ssoService = {
  /**
   * Get all configured SSO providers
   */
  async getProviders(tenantId?: string): Promise<SSOProvider[]> {
    // In production, fetch from database
    // return await prisma.sSOProvider.findMany({
    //   where: tenantId ? { tenantId } : {},
    //   orderBy: { name: "asc" },
    // });

    // Mock response
    return [
      {
        id: "sso_azure",
        name: "Azure AD",
        type: "saml",
        enabled: true,
        config: {
          entityId: "https://login.microsoftonline.com/xxx",
          ssoUrl: "https://login.microsoftonline.com/xxx/saml2",
          certificate: "MIIC...",
          signatureAlgorithm: "RSA-SHA256",
          digestAlgorithm: "SHA256",
          wantAssertionsSigned: true,
          wantResponseSigned: true,
          nameIdFormat: "emailAddress",
        },
        attributeMapping: {
          email: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
          firstName: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
          lastName: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "sso_okta",
        name: "Okta",
        type: "oidc",
        enabled: false,
        config: {
          clientId: "xxx",
          clientSecret: "xxx",
          issuer: "https://xxx.okta.com",
          authorizationUrl: "https://xxx.okta.com/oauth2/v1/authorize",
          tokenUrl: "https://xxx.okta.com/oauth2/v1/token",
          userInfoUrl: "https://xxx.okta.com/oauth2/v1/userinfo",
          scopes: ["openid", "profile", "email"],
          responseType: "code",
        },
        attributeMapping: {
          email: "email",
          firstName: "given_name",
          lastName: "family_name",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  },

  /**
   * Get a specific provider
   */
  async getProvider(providerId: string): Promise<SSOProvider | null> {
    const providers = await this.getProviders();
    return providers.find((p) => p.id === providerId) || null;
  },

  /**
   * Create or update SSO provider
   */
  async upsertProvider(provider: Partial<SSOProvider>): Promise<SSOProvider> {
    // In production, save to database
    console.log("[SSO] Provider saved:", provider);

    return {
      id: provider.id || `sso_${Date.now()}`,
      name: provider.name || "New Provider",
      type: provider.type || "saml",
      enabled: provider.enabled ?? false,
      config: provider.config as SAMLConfig | OIDCConfig,
      attributeMapping: provider.attributeMapping || { email: "email" },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  /**
   * Delete SSO provider
   */
  async deleteProvider(providerId: string): Promise<void> {
    // await prisma.sSOProvider.delete({ where: { id: providerId } });
    console.log("[SSO] Provider deleted:", providerId);
  },

  /**
   * Generate SAML metadata for service provider
   */
  generateSPMetadata(baseUrl: string): string {
    const entityId = `${baseUrl}/api/auth/sso/metadata`;
    const acsUrl = `${baseUrl}/api/auth/sso/callback`;
    const sloUrl = `${baseUrl}/api/auth/sso/logout`;

    return `<?xml version="1.0"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${entityId}">
  <md:SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="${sloUrl}"/>
    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${acsUrl}" index="1"/>
  </md:SPSSODescriptor>
</md:EntityDescriptor>`;
  },

  /**
   * Initiate SSO login
   */
  async initiateLogin(
    providerId: string,
    redirectUrl?: string
  ): Promise<{ redirectUrl: string; state: string }> {
    const provider = await this.getProvider(providerId);
    
    if (!provider) {
      throw new Error("SSO provider not found");
    }

    if (!provider.enabled) {
      throw new Error("SSO provider is not enabled");
    }

    const state = generateState();

    if (provider.type === "saml") {
      const config = provider.config as SAMLConfig;
      // Generate SAML AuthnRequest
      const samlRequest = generateSAMLRequest(config);
      const encodedRequest = Buffer.from(samlRequest).toString("base64");
      
      return {
        redirectUrl: `${config.ssoUrl}?SAMLRequest=${encodeURIComponent(encodedRequest)}&RelayState=${state}`,
        state,
      };
    }

    if (provider.type === "oidc" || provider.type === "oauth2") {
      const config = provider.config as OIDCConfig;
      const params = new URLSearchParams({
        client_id: config.clientId,
        response_type: config.responseType,
        scope: config.scopes.join(" "),
        redirect_uri: redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sso/callback`,
        state,
      });

      return {
        redirectUrl: `${config.authorizationUrl}?${params.toString()}`,
        state,
      };
    }

    throw new Error("Unsupported SSO provider type");
  },

  /**
   * Handle SSO callback
   */
  async handleCallback(
    providerId: string,
    params: Record<string, string>
  ): Promise<{ user: any; session: SSOSession }> {
    const provider = await this.getProvider(providerId);
    
    if (!provider) {
      throw new Error("SSO provider not found");
    }

    let userAttributes: Record<string, any> = {};

    if (provider.type === "saml") {
      // Parse SAML response
      const samlResponse = params.SAMLResponse;
      if (!samlResponse) {
        throw new Error("Missing SAML response");
      }

      // Decode and validate SAML response
      // In production, use a proper SAML library
      userAttributes = parseSAMLResponse(samlResponse);
    }

    if (provider.type === "oidc" || provider.type === "oauth2") {
      const config = provider.config as OIDCConfig;
      const code = params.code;

      if (!code) {
        throw new Error("Missing authorization code");
      }

      // Exchange code for tokens
      const tokenResponse = await fetch(config.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sso/callback`,
        }),
      });

      const tokens = await tokenResponse.json();

      // Get user info
      const userInfoResponse = await fetch(config.userInfoUrl, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      userAttributes = await userInfoResponse.json();
    }

    // Map attributes to user
    const user = mapAttributes(userAttributes, provider.attributeMapping);

    // Create SSO session
    const session: SSOSession = {
      id: `sso_sess_${Date.now()}`,
      userId: user.id || "",
      providerId: provider.id,
      providerUserId: userAttributes.sub || userAttributes.nameId,
      attributes: userAttributes,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    console.log("[SSO] User authenticated:", user.email);

    return { user, session };
  },

  /**
   * Handle SSO logout
   */
  async handleLogout(sessionId: string): Promise<void> {
    // Invalidate SSO session
    // await prisma.sSOSession.delete({ where: { id: sessionId } });
    console.log("[SSO] Session logged out:", sessionId);
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateState(): string {
  return Math.random().toString(36).substring(2, 15);
}

function generateSAMLRequest(config: SAMLConfig): string {
  // Simplified SAML AuthnRequest - in production use proper library
  const id = `_${Math.random().toString(36).substring(2, 15)}`;
  const issueInstant = new Date().toISOString();

  return `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
    ID="${id}"
    Version="2.0"
    IssueInstant="${issueInstant}"
    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
    Destination="${config.ssoUrl}">
    <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${config.entityId}</saml:Issuer>
  </samlp:AuthnRequest>`;
}

function parseSAMLResponse(response: string): Record<string, any> {
  // Simplified parsing - in production use proper SAML library
  const decoded = Buffer.from(response, "base64").toString("utf-8");
  
  // Extract attributes from SAML assertion
  // This is a placeholder - real implementation would parse XML
  return {
    nameId: "user@example.com",
    email: "user@example.com",
    firstName: "John",
    lastName: "Doe",
  };
}

function mapAttributes(
  attributes: Record<string, any>,
  mapping: AttributeMapping
): Record<string, any> {
  return {
    email: getAttribute(attributes, mapping.email),
    firstName: mapping.firstName ? getAttribute(attributes, mapping.firstName) : undefined,
    lastName: mapping.lastName ? getAttribute(attributes, mapping.lastName) : undefined,
    name: mapping.displayName
      ? getAttribute(attributes, mapping.displayName)
      : `${getAttribute(attributes, mapping.firstName || "")} ${getAttribute(attributes, mapping.lastName || "")}`.trim(),
    department: mapping.department ? getAttribute(attributes, mapping.department) : undefined,
    role: mapping.role ? getAttribute(attributes, mapping.role) : undefined,
  };
}

function getAttribute(attributes: Record<string, any>, key: string): string | undefined {
  // Handle nested keys (e.g., "claims.email")
  const parts = key.split(".");
  let value: any = attributes;
  
  for (const part of parts) {
    if (value && typeof value === "object") {
      value = value[part];
    } else {
      return undefined;
    }
  }

  return typeof value === "string" ? value : undefined;
}

export default ssoService;
