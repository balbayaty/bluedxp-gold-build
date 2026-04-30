/**
 * Example Batch Processing Job Handler
 *
 * This is an example of how to create a job handler for batch processing.
 * You can use this as a template for your own job handlers.
 */

import { JobHandler, JobProgress } from "@/types/job";

/**
 * Example: Batch Process Items
 *
 * Processes a list of items in batches with progress reporting
 */
export const batchProcessHandler: JobHandler = {
  type: "BATCH_PROCESSING",

  async validate(input: Record<string, any>) {
    if (!input.items || !Array.isArray(input.items)) {
      return { valid: false, error: "Items array is required" };
    }
    if (input.items.length === 0) {
      return { valid: false, error: "Items array cannot be empty" };
    }
    return { valid: true };
  },

  async estimateDuration(input: Record<string, any>) {
    const items = input.items as any[];
    const itemsPerSecond = 10; // Estimate: 10 items per second
    return (items.length / itemsPerSecond) * 1000; // Convert to milliseconds
  },

  async process(job, onProgress) {
    const items = job.input.items as any[];
    const batchSize = job.input.batchSize || 10;
    const results: any[] = [];

    // Initialize progress
    await onProgress({
      current: 0,
      total: items.length,
      percentage: 0,
      message: "Starting batch processing...",
      stage: "initialization",
    });

    // Process items in batches
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(items.length / batchSize);

      await onProgress({
        current: i,
        total: items.length,
        percentage: Math.round((i / items.length) * 100),
        message: `Processing batch ${batchNumber} of ${totalBatches}...`,
        stage: "processing",
        details: {
          batchNumber,
          totalBatches,
          itemsInBatch: batch.length,
        },
      });

      // Simulate processing (replace with actual processing logic)
      for (const item of batch) {
        // Your processing logic here
        // Example: await processItem(item)
        results.push({
          itemId: item.id || item,
          processed: true,
          timestamp: new Date().toISOString(),
        });

        // Small delay to simulate work
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Final progress update
    await onProgress({
      current: items.length,
      total: items.length,
      percentage: 100,
      message: "Batch processing completed",
      stage: "completed",
    });

    return {
      processed: results.length,
      total: items.length,
      results,
    };
  },

  async cleanup(job) {
    // Cleanup any temporary resources
    // Example: Delete temporary files, close connections, etc.
    console.log(`Cleaning up job ${job.id}`);
  },
};
