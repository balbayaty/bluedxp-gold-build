/**
 * UPS API Client
 *
 * API Documentation: https://developer.ups.com/
 * Developer Portal: https://developer.ups.com/develop
 * API Reference: https://developer.ups.com/api/reference
 *
 * Air freight and ground shipping integration
 */

export interface UPSQuoteRequest {
  origin: {
    address: string;
    city: string;
    state?: string;
    country: string;
    postalCode: string;
  };
  destination: {
    address: string;
    city: string;
    state?: string;
    country: string;
    postalCode: string;
  };
  packages: Array<{
    weight: number; // lbs
    dimensions: {
      length: number; // inches
      width: number; // inches
      height: number; // inches
    };
  }>;
  serviceType?: "GROUND" | "AIR" | "EXPRESS" | "EXPRESS_PLUS";
}

export interface UPSQuote {
  quoteId: string;
  service: string;
  cost: {
    amount: number;
    currency: string;
  };
  transitTime: number; // hours
  validUntil: Date;
  terms: string[];
}

export interface UPSBooking {
  shipmentId: string;
  trackingNumber: string;
  status: "CONFIRMED" | "PENDING" | "REJECTED";
  labelUrl: string;
  estimatedDelivery: Date;
}

export class UPSApiClient {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string = "https://api.ups.com";
  private accountNumber: string;

  constructor(clientId: string, clientSecret: string, accountNumber: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.accountNumber = accountNumber;
  }

  /**
   * Get authentication token
   * API Docs: https://developer.ups.com/api/reference/security
   */
  private async getAuthToken(): Promise<string> {
    // UPS uses OAuth2
    // See: https://developer.ups.com/api/reference/security
    const credentials = Buffer.from(
      `${this.clientId}:${this.clientSecret}`,
    ).toString("base64");

    const response = await fetch(
      "https://api.ups.com/security/v1/oauth/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      },
    );

    if (!response.ok) {
      throw new Error("UPS authentication failed");
    }

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Get quote for shipment
   * API Docs: https://developer.ups.com/api/reference/rating
   */
  async getQuote(request: UPSQuoteRequest): Promise<UPSQuote | null> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${this.baseUrl}/api/rating/v1/Rate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          transId: `trans-${Date.now()}`,
        },
        body: JSON.stringify({
          RateRequest: {
            Request: {
              RequestOption: "Rate",
            },
            Shipment: {
              Shipper: {
                Name: "Shipper",
                ShipperNumber: this.accountNumber,
                Address: {
                  AddressLine: [request.origin.address],
                  City: request.origin.city,
                  StateProvinceCode: request.origin.state,
                  PostalCode: request.origin.postalCode,
                  CountryCode: request.origin.country,
                },
              },
              ShipTo: {
                Name: "Recipient",
                Address: {
                  AddressLine: [request.destination.address],
                  City: request.destination.city,
                  StateProvinceCode: request.destination.state,
                  PostalCode: request.destination.postalCode,
                  CountryCode: request.destination.country,
                },
              },
              ShipFrom: {
                Name: "Shipper",
                Address: {
                  AddressLine: [request.origin.address],
                  City: request.origin.city,
                  StateProvinceCode: request.origin.state,
                  PostalCode: request.origin.postalCode,
                  CountryCode: request.origin.country,
                },
              },
              Package: request.packages.map((pkg) => ({
                PackagingType: {
                  Code: "02",
                  Description: "Package",
                },
                Dimensions: {
                  UnitOfMeasurement: {
                    Code: "IN",
                    Description: "Inches",
                  },
                  Length: String(pkg.dimensions.length),
                  Width: String(pkg.dimensions.width),
                  Height: String(pkg.dimensions.height),
                },
                PackageWeight: {
                  UnitOfMeasurement: {
                    Code: "LBS",
                    Description: "Pounds",
                  },
                  Weight: String(pkg.weight),
                },
              })),
            },
          },
        }),
      });

      if (!response.ok) {
        console.error("UPS quote request failed:", await response.text());
        return null;
      }

      const data = await response.json();
      const rateResponse = data.RateResponse?.RatedShipment?.[0];

      if (!rateResponse) {
        return null;
      }

      return {
        quoteId: `ups-${Date.now()}`,
        service: rateResponse.Service?.Code || request.serviceType || "GROUND",
        cost: {
          amount: parseFloat(rateResponse.TotalCharges?.MonetaryValue || "0"),
          currency: rateResponse.TotalCharges?.CurrencyCode || "USD",
        },
        transitTime: 24, // Default, would come from API
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        terms: [],
      };
    } catch (error) {
      console.error("UPS API error:", error);
      return null;
    }
  }

  /**
   * Book shipment
   * API Docs: https://developer.ups.com/api/reference/shipping
   */
  async bookShipment(
    quoteId: string,
    bookingDetails: any,
  ): Promise<UPSBooking | null> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${this.baseUrl}/api/shipments/v1/ship`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          transId: `trans-${Date.now()}`,
        },
        body: JSON.stringify({
          ShipmentRequest: {
            Request: {
              RequestOption: "nonvalidate",
            },
            Shipment: {
              ...bookingDetails,
            },
          },
        }),
      });

      if (!response.ok) {
        console.error("UPS booking failed:", await response.text());
        return null;
      }

      const data = await response.json();
      const shipmentResponse = data.ShipmentResponse?.ShipmentResults;

      if (!shipmentResponse) {
        return null;
      }

      return {
        shipmentId: shipmentResponse.ShipmentIdentificationNumber,
        trackingNumber: shipmentResponse.ShipmentIdentificationNumber,
        status: "CONFIRMED",
        labelUrl: shipmentResponse.LabelImage?.LabelImageFormat?.GraphicImage,
        estimatedDelivery: new Date(
          shipmentResponse.ShipmentCharges?.TotalCharges?.MonetaryValue ||
            Date.now(),
        ),
      };
    } catch (error) {
      console.error("UPS booking error:", error);
      return null;
    }
  }

  /**
   * Track shipment
   * API Docs: https://developer.ups.com/api/reference/tracking
   */
  async trackShipment(trackingNumber: string): Promise<any> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(
        `${this.baseUrl}/api/track/v1/details/${trackingNumber}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            transId: `trans-${Date.now()}`,
          },
        },
      );

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("UPS tracking error:", error);
      return null;
    }
  }
}

let upsClientInstance: UPSApiClient | null = null;

export function getUPSClient(): UPSApiClient | null {
  if (
    !process.env.UPS_CLIENT_ID ||
    !process.env.UPS_CLIENT_SECRET ||
    !process.env.UPS_ACCOUNT_NUMBER
  ) {
    return null;
  }

  if (!upsClientInstance) {
    upsClientInstance = new UPSApiClient(
      process.env.UPS_CLIENT_ID,
      process.env.UPS_CLIENT_SECRET,
      process.env.UPS_ACCOUNT_NUMBER,
    );
  }

  return upsClientInstance;
}
