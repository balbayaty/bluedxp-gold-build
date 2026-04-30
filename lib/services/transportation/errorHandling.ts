/**
 * Transportation Error Handling Utilities
 *
 * Comprehensive error handling for all transportation services
 */

export class TransportationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any,
  ) {
    super(message);
    this.name = "TransportationError";
  }
}

export class ShipmentNotFoundError extends TransportationError {
  constructor(shipmentId: string) {
    super(`Shipment not found: ${shipmentId}`, "SHIPMENT_NOT_FOUND", 404, {
      shipmentId,
    });
    this.name = "ShipmentNotFoundError";
  }
}

export class CarrierNotFoundError extends TransportationError {
  constructor(carrierId: string) {
    super(`Carrier not found: ${carrierId}`, "CARRIER_NOT_FOUND", 404, {
      carrierId,
    });
    this.name = "CarrierNotFoundError";
  }
}

export class InvalidRouteError extends TransportationError {
  constructor(message: string, details?: any) {
    super(`Invalid route: ${message}`, "INVALID_ROUTE", 400, details);
    this.name = "InvalidRouteError";
  }
}

export class ComplianceViolationError extends TransportationError {
  constructor(violations: string[]) {
    super(`Compliance violations detected`, "COMPLIANCE_VIOLATION", 400, {
      violations,
    });
    this.name = "ComplianceViolationError";
  }
}

export class IoTConnectionError extends TransportationError {
  constructor(provider: string, details?: any) {
    super(`IoT connection failed: ${provider}`, "IOT_CONNECTION_ERROR", 503, {
      provider,
      ...details,
    });
    this.name = "IoTConnectionError";
  }
}

export class ELMIntegrationError extends TransportationError {
  constructor(message: string, details?: any) {
    super(
      `ELM/Rabet.sa integration error: ${message}`,
      "ELM_INTEGRATION_ERROR",
      503,
      details,
    );
    this.name = "ELMIntegrationError";
  }
}

export class PaymentProcessingError extends TransportationError {
  constructor(message: string, details?: any) {
    super(
      `Payment processing error: ${message}`,
      "PAYMENT_PROCESSING_ERROR",
      402,
      details,
    );
    this.name = "PaymentProcessingError";
  }
}

export class FreightAuditError extends TransportationError {
  constructor(message: string, details?: any) {
    super(
      `Freight audit error: ${message}`,
      "FREIGHT_AUDIT_ERROR",
      400,
      details,
    );
    this.name = "FreightAuditError";
  }
}

/**
 * Error handler utility
 */
export function handleTransportationError(error: unknown): {
  message: string;
  code: string;
  statusCode: number;
  details?: any;
} {
  if (error instanceof TransportationError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: "UNKNOWN_ERROR",
      statusCode: 500,
    };
  }

  return {
    message: "An unknown error occurred",
    code: "UNKNOWN_ERROR",
    statusCode: 500,
  };
}

/**
 * Async error wrapper
 */
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      const handled = handleTransportationError(error);
      throw new TransportationError(
        handled.message,
        handled.code,
        handled.statusCode,
        handled.details,
      );
    }
  }) as T;
}
