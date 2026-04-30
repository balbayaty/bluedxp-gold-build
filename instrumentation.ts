/**
 * Next.js Instrumentation Hook
 *
 * Runs when the server starts. We use it to:
 * 1. Enforce "Strict Production Mode"
 * 2. Initialize OpenTelemetry SDK for full observability
 * 3. Set up distributed tracing, metrics, and auto-instrumentation
 */

export const runtime = 'nodejs'

export async function register(): Promise<void> {
  // Only execute on the server runtime.
  const { assertProductionReady } = await import('@/lib/services/production/productionGate')
  await assertProductionReady()

  // Initialize OpenTelemetry SDK for full observability
  if (process.env.OTEL_ENABLED !== 'false') {
    try {
      await initializeOpenTelemetry()
    } catch (error) {
      console.error('⚠️ OpenTelemetry initialization failed (continuing without it):', error)
    }
  }

  // ============================================================================
  // INITIALIZE GCC COMPLIANCE MODULE (Saudi Arabia & GCC Transport Compliance)
  // ============================================================================
  if (process.env.GCC_COMPLIANCE_ENABLED !== 'false') {
    try {
      const { initializeGCCCompliance } = await import('@/lib/services/gcc-compliance')
      await initializeGCCCompliance()
      console.log('✅ GCC Compliance Module initialized (auto-validation enabled)')
    } catch (error) {
      console.error('⚠️ GCC Compliance initialization failed (continuing without it):', error)
    }
  }

  // ============================================================================
  // INITIALIZE IOT POLLING SERVICE (Real-time GPS Tracking)
  // ============================================================================
  if (process.env.IOT_POLLING_ENABLED === 'true') {
    try {
      const { getIotPollingService } = await import('@/lib/services/iot')
      
      const pollingService = getIotPollingService({
        intervalMs: parseInt(process.env.IOT_POLLING_INTERVAL_MS || '30000', 10),
        daleeliEnabled: process.env.DALEELI_ENABLED === 'true',
        daleeliIntervalMs: parseInt(process.env.DALEELI_POLLING_INTERVAL_MS || '60000', 10),
        autoGeofence: process.env.IOT_AUTO_GEOFENCE !== 'false',
        defaultTenantId: process.env.DEFAULT_TENANT_ID || 'default',
      })
      
      await pollingService.initialize()
      await pollingService.start()
      
      console.log('✅ IoT Polling Service initialized and started')
      console.log(`   Polling interval: ${process.env.IOT_POLLING_INTERVAL_MS || '30000'}ms`)
      console.log(`   Daleeli enabled: ${process.env.DALEELI_ENABLED === 'true'}`)
      console.log(`   Auto-geofence: ${process.env.IOT_AUTO_GEOFENCE !== 'false'}`)
      
      // Graceful shutdown
      process.on('SIGTERM', async () => {
        await pollingService.stop()
        console.log('✅ IoT Polling Service stopped')
      })
    } catch (error) {
      console.error('⚠️ IoT Polling Service initialization failed (continuing without it):', error)
    }
  }
}

/**
 * Initialize OpenTelemetry SDK with full instrumentation
 * This provides distributed tracing, metrics, and auto-instrumentation
 */
async function initializeOpenTelemetry(): Promise<void> {
  try {
    // Dynamic import to avoid bundling issues
    const { NodeSDK } = await import('@opentelemetry/sdk-node')
    const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node')
    const { JaegerExporter } = await import('@opentelemetry/exporter-jaeger')
    const { Resource } = await import('@opentelemetry/resources')
    const { SemanticResourceAttributes } = await import('@opentelemetry/semantic-conventions')
    const { SimpleSpanProcessor, BatchSpanProcessor } = await import('@opentelemetry/sdk-trace-base')

    const jaegerEndpoint = process.env.JAEGER_ENDPOINT || process.env.JAEGER_URL || 'http://localhost:14268/api/traces'
    const serviceName = process.env.OTEL_SERVICE_NAME || 'bluedxp-platform'
    const serviceVersion = process.env.APP_VERSION || process.env.npm_package_version || '1.0.0'
    const environment = process.env.NODE_ENV || 'development'

    // Create Jaeger exporter
    const jaegerExporter = new JaegerExporter({
      endpoint: jaegerEndpoint,
    })

    // Create resource with service metadata
    const resource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment,
      [SemanticResourceAttributes.SERVICE_NAMESPACE]: 'bluedxp',
    })

    // Initialize SDK with auto-instrumentations
    const sdk = new NodeSDK({
      resource,
      traceExporter: jaegerExporter,
      spanProcessor: new BatchSpanProcessor(jaegerExporter, {
        maxQueueSize: 2048,
        maxExportBatchSize: 512,
        scheduledDelayMillis: 5000,
        exportTimeoutMillis: 30000,
      }),
      instrumentations: [
        getNodeAutoInstrumentations({
          // Disable file system instrumentation (too noisy)
          '@opentelemetry/instrumentation-fs': {
            enabled: false,
          },
          // HTTP instrumentation
          '@opentelemetry/instrumentation-http': {
            enabled: true,
            ignoreIncomingRequestHook: (req) => {
              // Ignore health checks and metrics endpoints
              const url = req.url || ''
              return url.includes('/api/health') || url.includes('/api/metrics')
            },
            requestHook: (span, request) => {
              // Add custom attributes
              span.setAttribute('http.method', request.method || 'GET')
              span.setAttribute('http.url', request.url || '')
            },
          },
          // Express/Next.js instrumentation
          '@opentelemetry/instrumentation-express': {
            enabled: true,
          },
          // PostgreSQL instrumentation
          '@opentelemetry/instrumentation-pg': {
            enabled: true,
          },
          // Redis instrumentation
          '@opentelemetry/instrumentation-redis': {
            enabled: true,
          },
          // gRPC instrumentation (if used)
          '@opentelemetry/instrumentation-grpc': {
            enabled: process.env.GRPC_ENABLED === 'true',
          },
        }),
      ],
    })

    // Start the SDK
    sdk.start()
    console.log('✅ OpenTelemetry SDK initialized')
    console.log(`   Service: ${serviceName} v${serviceVersion}`)
    console.log(`   Environment: ${environment}`)
    console.log(`   Jaeger Endpoint: ${jaegerEndpoint}`)

    // Graceful shutdown
    process.on('SIGTERM', () => {
      sdk.shutdown()
        .then(() => console.log('✅ OpenTelemetry SDK shut down'))
        .catch((error) => console.error('❌ Error shutting down OpenTelemetry SDK:', error))
        .finally(() => process.exit(0))
    })
  } catch (error: any) {
    // If OpenTelemetry packages are not installed, fail gracefully
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('⚠️ OpenTelemetry packages not installed. Install with: npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node')
      return
    }
    throw error
  }
}


