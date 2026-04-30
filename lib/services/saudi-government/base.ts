/**
 * Base Saudi Government API Adapter
 * Common functionality for all Saudi government API integrations
 */

import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

export interface SaudiGovAPIConfig {
  baseURL: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
}

export abstract class SaudiGovAPIBase {
  protected client: AxiosInstance;
  protected config: SaudiGovAPIConfig;

  constructor(config: SaudiGovAPIConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        "Content-Type": "application/json",
        ...(config.apiKey && { "X-API-Key": config.apiKey }),
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(
          `[${this.constructor.name}] Request:`,
          config.method?.toUpperCase(),
          config.url,
        );
        return config;
      },
      (error) => {
        console.error(`[${this.constructor.name}] Request error:`, error);
        return Promise.reject(error);
      },
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;
        if (!config || !config.retry) {
          return Promise.reject(error);
        }

        config.retryCount = config.retryCount || 0;
        if (config.retryCount >= (this.config.retries || 3)) {
          return Promise.reject(error);
        }

        config.retryCount += 1;
        const delay = Math.pow(2, config.retryCount) * 1000;

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.client(config);
      },
    );
  }

  /**
   * Make API request with retry logic
   */
  protected async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.request<T>({
        ...config,
        retry: true,
      });
      return response.data;
    } catch (error: any) {
      console.error(`[${this.constructor.name}] API Error:`, error.message);
      throw new Error(`Saudi Government API Error: ${error.message}`);
    }
  }

  /**
   * Verify credentials/connection
   */
  abstract verify(): Promise<boolean>;
}
