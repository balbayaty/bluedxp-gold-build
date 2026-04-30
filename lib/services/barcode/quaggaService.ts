/**
 * QuaggaJS Barcode Scanner Service
 * Real-time barcode detection using QuaggaJS
 */

export interface ScanResult {
  code: string;
  format: string;
  confidence: number;
}

export class QuaggaService {
  private isInitialized: boolean = false;

  /**
   * Initialize QuaggaJS
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Dynamic import to avoid SSR issues
      const Quagga = await import("quagga");
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error(
        "QuaggaJS not available. Install with: npm install quagga",
        error,
      );
      return false;
    }
  }

  /**
   * Start scanning from video element
   */
  async startScanning(
    videoElement: HTMLVideoElement | string,
    onDetected: (result: ScanResult) => void,
    config?: {
      readers?: string[];
      locate?: boolean;
    },
  ): Promise<boolean> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return false;
    }

    try {
      const Quagga = await import("quagga");

      const elementId =
        typeof videoElement === "string"
          ? videoElement
          : videoElement.id || "barcode-scanner";

      Quagga.default.init(
        {
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target:
              typeof videoElement === "string"
                ? document.querySelector(videoElement)
                : videoElement,
            constraints: {
              width: 640,
              height: 480,
              facingMode: "environment", // Use back camera
            },
          },
          locator: {
            patchSize: "medium",
            halfSample: true,
          },
          numOfWorkers: 2,
          frequency: 10,
          decoder: {
            readers: config?.readers || [
              "code_128_reader",
              "ean_reader",
              "ean_8_reader",
              "code_39_reader",
              "code_39_vin_reader",
              "codabar_reader",
              "upc_reader",
              "upc_e_reader",
              "i2of5_reader",
              "2of5_reader",
              "code_93_reader",
            ],
          },
          locate: config?.locate !== false,
        },
        (err: any) => {
          if (err) {
            console.error("QuaggaJS initialization error:", err);
            return false;
          }
          Quagga.default.start();
        },
      );

      Quagga.default.onDetected((result: any) => {
        const code = result.codeResult.code;
        const format = result.codeResult.format || "unknown";
        const confidence =
          result.codeResult.decodedCodes?.reduce(
            (sum: number, code: any) => sum + (code.error || 0),
            0,
          ) || 0;

        onDetected({
          code,
          format,
          confidence: Math.max(0, 100 - confidence),
        });
      });

      return true;
    } catch (error) {
      console.error("Error starting QuaggaJS:", error);
      return false;
    }
  }

  /**
   * Stop scanning
   */
  async stopScanning(): Promise<void> {
    try {
      const Quagga = await import("quagga");
      Quagga.default.stop();
    } catch (error) {
      console.error("Error stopping QuaggaJS:", error);
    }
  }

  /**
   * Scan from image
   */
  async scanFromImage(imageFile: File): Promise<ScanResult | null> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return null;
    }

    try {
      const Quagga = await import("quagga");

      return new Promise((resolve) => {
        Quagga.default.decodeSingle(
          {
            decoder: {
              readers: [
                "code_128_reader",
                "ean_reader",
                "code_39_reader",
                "qr_reader",
              ],
            },
            locate: true,
            src: URL.createObjectURL(imageFile),
          },
          (result: any) => {
            if (result && result.codeResult) {
              resolve({
                code: result.codeResult.code,
                format: result.codeResult.format || "unknown",
                confidence: 85,
              });
            } else {
              resolve(null);
            }
          },
        );
      });
    } catch (error) {
      console.error("Error scanning image:", error);
      return null;
    }
  }
}

export const quaggaService = new QuaggaService();
