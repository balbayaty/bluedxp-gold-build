/**
 * MSC (Mediterranean Shipping Company) API Client
 *
 * API Documentation: https://www.msc.com/api
 * Developer Portal: https://developer.msc.com
 *
 * Sea freight carrier integration for container shipping
 */

export interface MSCQuoteRequest {
  origin: {
    port: string;
    country: string;
  };
  destination: {
    port: string;
    country: string;
  };
  containers: Array<{
    type: "20FT" | "40FT" | "40FT_HC" | "45FT";
    quantity: number;
  }>;
  cargoType?: string;
  serviceType?: "FCL" | "LCL";
}

export interface MSCQuote {
  quoteId: string;
  service: string;
  cost: {
    amount: number;
    currency: string;
  };
  transitTime: number; // days
  validUntil: Date;
  terms: string[];
}

export interface MSCBooking {
  bookingNumber: string;
  status: "CONFIRMED" | "PENDING" | "REJECTED";
  containerNumbers: string[];
  vessel: string;
  voyage: string;
  etd: Date;
  eta: Date;
}

export class MSCApiClient {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string = "https://api.msc.com/v1";

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  /**
   * Get authentication token
   */
  private async getAuthToken(): Promise<string> {
    // TODO: Implement OAuth2 authentication
    // See: https://developer.msc.com/docs/authentication
    const response = await fetch(`${this.baseUrl}/auth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiKey: this.apiKey,
        apiSecret: this.apiSecret,
      }),
    });

    if (!response.ok) {
      throw new Error("MSC authentication failed");
    }

    const data = await response.json();
    return data.accessToken;
  }

  /**
   * Get quote for shipment
   * API Docs: https://developer.msc.com/docs/quotes
   */
  async getQuote(request: MSCQuoteRequest): Promise<MSCQuote | null> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${this.baseUrl}/quotes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        console.error("MSC quote request failed:", await response.text());
        return null;
      }

      const data = await response.json();
      return {
        quoteId: data.quoteId,
        service: data.serviceName,
        cost: {
          amount: data.totalCost,
          currency: data.currency || "USD",
        },
        transitTime: data.transitDays,
        validUntil: new Date(data.validUntil),
        terms: data.terms || [],
      };
    } catch (error) {
      console.error("MSC API error:", error);
      return null;
    }
  }

  /**
   * Book shipment
   * API Docs: https://developer.msc.com/docs/bookings
   */
  async bookShipment(
    quoteId: string,
    bookingDetails: any,
  ): Promise<MSCBooking | null> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${this.baseUrl}/bookings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteId,
          ...bookingDetails,
        }),
      });

      if (!response.ok) {
        console.error("MSC booking failed:", await response.text());
        return null;
      }

      const data = await response.json();
      return {
        bookingNumber: data.bookingNumber,
        status: data.status,
        containerNumbers: data.containers || [],
        vessel: data.vessel,
        voyage: data.voyage,
        etd: new Date(data.etd),
        eta: new Date(data.eta),
      };
    } catch (error) {
      console.error("MSC booking error:", error);
      return null;
    }
  }

  /**
   * Track shipment
   * API Docs: https://developer.msc.com/docs/tracking
   */
  async trackShipment(bookingNumber: string): Promise<any> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(
        `${this.baseUrl}/tracking/${bookingNumber}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("MSC tracking error:", error);
      return null;
    }
  }
}

let mscClientInstance: MSCApiClient | null = null;

export function getMSCClient(): MSCApiClient | null {
  if (!process.env.MSC_API_KEY || !process.env.MSC_API_SECRET) {
    return null;
  }

  if (!mscClientInstance) {
    mscClientInstance = new MSCApiClient(
      process.env.MSC_API_KEY,
      process.env.MSC_API_SECRET,
    );
  }

  return mscClientInstance;
}
