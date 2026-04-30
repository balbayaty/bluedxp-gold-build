/**
 * Distributed Tracing Service
 * OpenTelemetry-compatible tracing for distributed systems
 * Connects to Jaeger for distributed tracing
 * Server-side only - client-side uses in-memory fallback
 */

// Optional OpenTelemetry imports - loaded dynamically on server only
function loadOpenTelemetry() {
  // Only load on server-side
  if (typeof window !== "undefined") {
    return null;
  }
  
  try {
    // Use dynamic require to prevent webpack bundling
    const req = typeof __webpack_require__ !== "undefined" 
      ? __non_webpack_require__ 
      : require;
    
    // Load each module separately and validate
    const api = req("@opentelemetry/api");
    const traceNode = req("@opentelemetry/sdk-trace-node");
    const jaeger = req("@opentelemetry/exporter-jaeger");
    const resources = req("@opentelemetry/resources");
    const conventions = req("@opentelemetry/semantic-conventions");
    
    // Validate Resource exists
    if (!resources?.Resource) {
      console.warn("⚠️ Tracing: OpenTelemetry Resource not available");
      return null;
    }
    
    return {
      trace: api?.trace,
      NodeTracerProvider: traceNode?.NodeTracerProvider,
      JaegerExporter: jaeger?.JaegerExporter,
      Resource: resources.Resource,
      SemanticResourceAttributes: conventions?.SemanticResourceAttributes || conventions?.SEMRESATTRS_SERVICE_NAME ? { SERVICE_NAME: "service.name" } : { SERVICE_NAME: "service.name" },
    };
  } catch (e) {
    // OpenTelemetry not installed or error loading
    console.warn("⚠️ Tracing: OpenTelemetry not available:", (e as Error).message);
    return null;
  }
}

// Declare webpack-specific globals
declare const __webpack_require__: any;
declare const __non_webpack_require__: any;

export interface Span {
  id: string;
  traceId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: "ok" | "error";
  attributes: Record<string, any>;
  events: Array<{
    name: string;
    timestamp: number;
    attributes?: Record<string, any>;
  }>;
}

export interface Trace {
  id: string;
  spans: Span[];
  startTime: number;
  endTime?: number;
  duration?: number;
  serviceName: string;
  tenantId?: string;
}

class TracingService {
  private traces: Map<string, Trace> = new Map();
  private activeSpans: Map<string, Span> = new Map();
  private otelProvider: any = null;
  private otelTracer: any = null;
  private jaegerEnabled: boolean = false;

  /**
   * Initialize OpenTelemetry and Jaeger exporter
   */
  async initialize(): Promise<void> {
    const otel = loadOpenTelemetry();
    if (!otel) {
      console.log(
        "⚠️ Tracing: OpenTelemetry not available, using in-memory tracing",
      );
      this.jaegerEnabled = false;
      return;
    }

    try {
      const jaegerUrl =
        process.env.JAEGER_URL || "http://localhost:14268/api/traces";

      // Create Jaeger exporter
      const jaegerExporter = new otel.JaegerExporter({
        endpoint: jaegerUrl,
      });

      // Create tracer provider
      this.otelProvider = new otel.NodeTracerProvider({
        resource: new otel.Resource({
          [otel.SemanticResourceAttributes.SERVICE_NAME]: "bluedxp-platform",
        }),
      });

      // Add Jaeger exporter
      this.otelProvider.addSpanProcessor(
        new (require("@opentelemetry/sdk-trace-base").SimpleSpanProcessor)(
          jaegerExporter,
        ),
      );

      // Register provider
      this.otelProvider.register();

      // Get tracer
      this.otelTracer = otel.trace.getTracer("bluedxp-platform", "1.0.0");

      this.jaegerEnabled = true;
      console.log(
        "✅ Tracing: OpenTelemetry initialized, Jaeger exporter connected",
      );
    } catch (error) {
      console.error("❌ Error initializing OpenTelemetry:", error);
      this.jaegerEnabled = false;
    }
  }

  /**
   * Start a new trace
   */
  startTrace(
    serviceName: string,
    operationName: string,
    tenantId?: string,
  ): Trace {
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const spanId = `span-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Use OpenTelemetry if available
    if (this.jaegerEnabled && this.otelTracer) {
      const span = this.otelTracer.startSpan(operationName, {
        attributes: {
          "service.name": serviceName,
          "operation.name": operationName,
          ...(tenantId && { "tenant.id": tenantId }),
        },
      });

      // Store span context
      const otelSpan = {
        id: span.spanContext().spanId,
        traceId: span.spanContext().traceId,
        name: operationName,
        startTime: Date.now(),
        status: "ok" as const,
        attributes: {
          "service.name": serviceName,
          "operation.name": operationName,
          ...(tenantId && { "tenant.id": tenantId }),
        },
        events: [],
        otelSpan: span, // Store OpenTelemetry span
      };

      this.activeSpans.set(spanId, otelSpan as any);
    }

    const rootSpan: Span = {
      id: spanId,
      traceId,
      name: operationName,
      startTime: Date.now(),
      status: "ok",
      attributes: {
        "service.name": serviceName,
        "operation.name": operationName,
        ...(tenantId && { "tenant.id": tenantId }),
      },
      events: [],
    };

    const trace: Trace = {
      id: traceId,
      spans: [rootSpan],
      startTime: rootSpan.startTime,
      serviceName,
      tenantId,
    };

    this.traces.set(traceId, trace);
    this.activeSpans.set(spanId, rootSpan);

    return trace;
  }

  /**
   * Start a child span
   */
  startSpan(
    traceId: string,
    parentSpanId: string,
    name: string,
    attributes?: Record<string, any>,
  ): Span {
    const spanId = `span-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const trace = this.traces.get(traceId);

    if (!trace) {
      throw new Error(`Trace ${traceId} not found`);
    }

    // Use OpenTelemetry if available
    if (this.jaegerEnabled && this.otelTracer) {
      const parentSpan = this.activeSpans.get(parentSpanId) as any;
      if (parentSpan?.otelSpan) {
        const span = this.otelTracer.startSpan(name, {
          parent: parentSpan.otelSpan,
          attributes,
        });

        const otelSpan = {
          id: span.spanContext().spanId,
          traceId: span.spanContext().traceId,
          parentSpanId,
          name,
          startTime: Date.now(),
          status: "ok" as const,
          attributes: attributes || {},
          events: [],
          otelSpan: span,
        };

        this.activeSpans.set(spanId, otelSpan as any);
        trace.spans.push(otelSpan as any);
        return otelSpan as any;
      }
    }

    const span: Span = {
      id: spanId,
      traceId,
      parentSpanId,
      name,
      startTime: Date.now(),
      status: "ok",
      attributes: attributes || {},
      events: [],
    };

    trace.spans.push(span);
    this.activeSpans.set(spanId, span);

    return span;
  }

  /**
   * End a span
   */
  endSpan(
    spanId: string,
    status: "ok" | "error" = "ok",
    attributes?: Record<string, any>,
  ): void {
    const span = this.activeSpans.get(spanId);
    if (!span) {
      return;
    }

    // End OpenTelemetry span if available
    if (this.jaegerEnabled && (span as any).otelSpan) {
      const otelSpan = (span as any).otelSpan;
      if (status === "error") {
        otelSpan.setStatus({ code: 2, message: "error" });
      }
      if (attributes) {
        otelSpan.setAttributes(attributes);
      }
      otelSpan.end();
    }

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;

    if (attributes) {
      Object.assign(span.attributes, attributes);
    }

    this.activeSpans.delete(spanId);

    // Update trace end time if this is the root span
    const trace = this.traces.get(span.traceId);
    if (trace && span.id === trace.spans[0].id) {
      trace.endTime = span.endTime;
      trace.duration = span.duration;
    }
  }

  /**
   * Add event to span
   */
  addEvent(
    spanId: string,
    eventName: string,
    attributes?: Record<string, any>,
  ): void {
    const span = this.activeSpans.get(spanId);
    if (!span) {
      return;
    }

    // Add event to OpenTelemetry span if available
    if (this.jaegerEnabled && (span as any).otelSpan) {
      (span as any).otelSpan.addEvent(eventName, attributes);
    }

    span.events.push({
      name: eventName,
      timestamp: Date.now(),
      attributes,
    });
  }

  /**
   * Get trace
   */
  getTrace(traceId: string): Trace | null {
    return this.traces.get(traceId) || null;
  }

  /**
   * Get traces
   */
  getTraces(filters?: {
    serviceName?: string;
    tenantId?: string;
    startTime?: number;
    endTime?: number;
  }): Trace[] {
    let traces = Array.from(this.traces.values());

    if (filters?.serviceName) {
      traces = traces.filter((t) => t.serviceName === filters.serviceName);
    }

    if (filters?.tenantId) {
      traces = traces.filter((t) => t.tenantId === filters.tenantId);
    }

    if (filters?.startTime) {
      traces = traces.filter((t) => t.startTime >= filters.startTime!);
    }

    if (filters?.endTime) {
      traces = traces.filter(
        (t) => (t.endTime || Date.now()) <= filters.endTime!,
      );
    }

    return traces.sort((a, b) => b.startTime - a.startTime);
  }
}

export const tracingService = new TracingService();

// Initialize on module load
tracingService.initialize().catch((error) => {
  console.error("Failed to initialize tracing:", error);
});
