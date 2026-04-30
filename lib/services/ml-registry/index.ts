/**
 * ML Model Registry & Training Pipeline
 * Centralized model management, versioning, and continuous learning
 * Supports A/B testing, model comparison, and automated retraining
 */

// ============================================================================
// TYPES
// ============================================================================

export type ModelType =
  | "classification"
  | "regression"
  | "anomaly_detection"
  | "time_series"
  | "clustering"
  | "object_detection"
  | "nlp"
  | "recommendation"
  | "reinforcement";

export type ModelStatus =
  | "draft"
  | "training"
  | "validating"
  | "ready"
  | "deployed"
  | "deprecated"
  | "failed";

export interface MLModel {
  id: string;
  name: string;
  description: string;
  type: ModelType;
  version: string;

  // Configuration
  config: ModelConfig;

  // Training
  trainingInfo: TrainingInfo;

  // Performance
  metrics: ModelMetrics;

  // Deployment
  deployment: DeploymentInfo;

  // Lifecycle
  status: ModelStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  tags: string[];
}

export interface ModelConfig {
  algorithm: string;
  hyperparameters: Record<string, any>;
  features: string[];
  targetVariable?: string;
  preprocessing?: PreprocessingStep[];
  postprocessing?: PostprocessingStep[];
}

export interface PreprocessingStep {
  name: string;
  type:
    | "normalize"
    | "standardize"
    | "encode"
    | "impute"
    | "transform"
    | "custom";
  params: Record<string, any>;
}

export interface PostprocessingStep {
  name: string;
  type: "threshold" | "calibrate" | "ensemble" | "filter" | "custom";
  params: Record<string, any>;
}

export interface TrainingInfo {
  datasetId?: string;
  datasetSize: number;
  trainSize: number;
  validSize: number;
  testSize: number;
  trainingDuration: number; // seconds
  epochs?: number;
  batchSize?: number;
  learningRate?: number;
  startedAt?: Date | string;
  completedAt?: Date | string;
  error?: string;
}

export interface ModelMetrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  auc?: number;
  mse?: number;
  rmse?: number;
  mae?: number;
  r2?: number;
  confusionMatrix?: number[][];
  customMetrics?: Record<string, number>;
  validationResults?: {
    metric: string;
    value: number;
    threshold: number;
    passed: boolean;
  }[];
}

export interface DeploymentInfo {
  isDeployed: boolean;
  environment?: "development" | "staging" | "production";
  endpoint?: string;
  deployedAt?: Date | string;
  deployedBy?: string;
  replicas?: number;
  resourceAllocation?: {
    cpu: string;
    memory: string;
    gpu?: string;
  };
  autoscaling?: {
    enabled: boolean;
    minReplicas: number;
    maxReplicas: number;
    targetCPU: number;
  };
}

// ============================================================================
// TRAINING TYPES
// ============================================================================

export interface TrainingJob {
  id: string;
  modelId: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";

  // Configuration
  config: TrainingJobConfig;

  // Progress
  progress: {
    currentEpoch?: number;
    totalEpochs?: number;
    currentStep?: number;
    totalSteps?: number;
    loss?: number;
    validationLoss?: number;
    percentComplete: number;
  };

  // Resources
  resourceUsage: {
    cpuPercent: number;
    memoryUsed: number;
    gpuMemoryUsed?: number;
  };

  // Logs
  logs: TrainingLog[];

  // Results
  resultModelId?: string;
  error?: string;

  // Timestamps
  createdAt: Date | string;
  startedAt?: Date | string;
  completedAt?: Date | string;
}

export interface TrainingJobConfig {
  datasetConfig: {
    datasetId?: string;
    dataSource?: string;
    trainSplit: number;
    validSplit: number;
    testSplit: number;
    shuffleSeed?: number;
  };

  modelConfig: Partial<ModelConfig>;

  trainingConfig: {
    epochs: number;
    batchSize: number;
    learningRate: number;
    optimizer?: string;
    lossFunction?: string;
    earlyStopping?: {
      enabled: boolean;
      patience: number;
      minDelta: number;
    };
    checkpointing?: {
      enabled: boolean;
      saveEvery: number;
    };
  };

  resourceConfig?: {
    gpuRequired: boolean;
    maxMemory?: string;
    maxTime?: number; // seconds
  };
}

export interface TrainingLog {
  timestamp: Date | string;
  level: "info" | "warning" | "error";
  message: string;
  data?: Record<string, any>;
}

// ============================================================================
// A/B TESTING TYPES
// ============================================================================

export interface ABTest {
  id: string;
  name: string;
  description: string;

  // Models being tested
  controlModelId: string;
  treatmentModelId: string;

  // Configuration
  trafficSplit: number; // Percentage going to treatment (0-100)
  minimumSampleSize: number;
  confidenceLevel: number; // e.g., 0.95

  // Status
  status: "running" | "completed" | "cancelled";

  // Results
  results?: ABTestResults;

  // Timestamps
  startedAt: Date | string;
  endedAt?: Date | string;
}

export interface ABTestResults {
  controlSamples: number;
  treatmentSamples: number;

  controlMetrics: Record<string, number>;
  treatmentMetrics: Record<string, number>;

  statisticalSignificance: boolean;
  pValue: number;
  confidenceInterval: [number, number];

  winner?: "control" | "treatment" | "no_difference";
  recommendation: string;
}

// ============================================================================
// IN-MEMORY STORAGE
// ============================================================================

class MLRegistryStore {
  private models: Map<string, MLModel> = new Map();
  private trainingJobs: Map<string, TrainingJob> = new Map();
  private abTests: Map<string, ABTest> = new Map();
  private predictions: {
    modelId: string;
    input: any;
    output: any;
    timestamp: string;
  }[] = [];

  // Models
  getModel(id: string): MLModel | undefined {
    return this.models.get(id);
  }

  setModel(model: MLModel): void {
    this.models.set(model.id, model);
  }

  deleteModel(id: string): boolean {
    return this.models.delete(id);
  }

  getAllModels(): MLModel[] {
    return Array.from(this.models.values());
  }

  // Training Jobs
  getTrainingJob(id: string): TrainingJob | undefined {
    return this.trainingJobs.get(id);
  }

  setTrainingJob(job: TrainingJob): void {
    this.trainingJobs.set(job.id, job);
  }

  getAllTrainingJobs(): TrainingJob[] {
    return Array.from(this.trainingJobs.values());
  }

  // A/B Tests
  getABTest(id: string): ABTest | undefined {
    return this.abTests.get(id);
  }

  setABTest(test: ABTest): void {
    this.abTests.set(test.id, test);
  }

  getAllABTests(): ABTest[] {
    return Array.from(this.abTests.values());
  }

  // Predictions
  addPrediction(prediction: (typeof this.predictions)[0]): void {
    this.predictions.push(prediction);
    // Keep only last 10000 predictions
    if (this.predictions.length > 10000) {
      this.predictions = this.predictions.slice(-10000);
    }
  }

  getPredictions(modelId: string): typeof this.predictions {
    return this.predictions.filter((p) => p.modelId === modelId);
  }
}

const store = new MLRegistryStore();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// ============================================================================
// ML MODEL REGISTRY SERVICE
// ============================================================================

class MLModelRegistry {
  // ============================================================================
  // MODEL MANAGEMENT
  // ============================================================================

  /**
   * Register a new model
   */
  async registerModel(
    data: Omit<
      MLModel,
      "id" | "createdAt" | "updatedAt" | "status" | "deployment"
    >,
  ): Promise<MLModel> {
    const model: MLModel = {
      ...data,
      id: generateId("model"),
      status: "draft",
      deployment: {
        isDeployed: false,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.setModel(model);
    return model;
  }

  /**
   * Get model by ID
   */
  async getModel(id: string): Promise<MLModel | null> {
    return store.getModel(id) || null;
  }

  /**
   * List all models
   */
  async listModels(filters?: {
    type?: ModelType;
    status?: ModelStatus;
    tags?: string[];
    deployed?: boolean;
  }): Promise<MLModel[]> {
    let models = store.getAllModels();

    if (filters?.type) {
      models = models.filter((m) => m.type === filters.type);
    }
    if (filters?.status) {
      models = models.filter((m) => m.status === filters.status);
    }
    if (filters?.tags?.length) {
      models = models.filter((m) =>
        filters.tags!.some((t) => m.tags.includes(t)),
      );
    }
    if (filters?.deployed !== undefined) {
      models = models.filter(
        (m) => m.deployment.isDeployed === filters.deployed,
      );
    }

    return models.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  /**
   * Update model metadata
   */
  async updateModel(id: string, updates: Partial<MLModel>): Promise<MLModel> {
    const existing = store.getModel(id);
    if (!existing) {
      throw new Error(`Model ${id} not found`);
    }

    const updated: MLModel = {
      ...existing,
      ...updates,
      id, // Prevent ID change
      updatedAt: new Date().toISOString(),
    };

    store.setModel(updated);
    return updated;
  }

  /**
   * Delete model
   */
  async deleteModel(id: string): Promise<boolean> {
    const model = store.getModel(id);
    if (model?.deployment.isDeployed) {
      throw new Error("Cannot delete deployed model. Undeploy first.");
    }
    return store.deleteModel(id);
  }

  /**
   * Get model versions
   */
  async getModelVersions(name: string): Promise<MLModel[]> {
    return store
      .getAllModels()
      .filter((m) => m.name === name)
      .sort((a, b) =>
        b.version.localeCompare(a.version, undefined, { numeric: true }),
      );
  }

  // ============================================================================
  // TRAINING OPERATIONS
  // ============================================================================

  /**
   * Start a training job
   */
  async startTraining(
    modelId: string,
    config: TrainingJobConfig,
  ): Promise<TrainingJob> {
    const model = store.getModel(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const job: TrainingJob = {
      id: generateId("train"),
      modelId,
      status: "pending",
      config,
      progress: {
        percentComplete: 0,
      },
      resourceUsage: {
        cpuPercent: 0,
        memoryUsed: 0,
      },
      logs: [
        {
          timestamp: new Date().toISOString(),
          level: "info",
          message: "Training job created",
        },
      ],
      createdAt: new Date().toISOString(),
    };

    store.setTrainingJob(job);

    // Update model status
    await this.updateModel(modelId, { status: "training" });

    // Start training (mock - would call actual training service)
    this.runTraining(job);

    return job;
  }

  /**
   * Get training job status
   */
  async getTrainingJob(id: string): Promise<TrainingJob | null> {
    return store.getTrainingJob(id) || null;
  }

  /**
   * List training jobs for a model
   */
  async listTrainingJobs(modelId?: string): Promise<TrainingJob[]> {
    let jobs = store.getAllTrainingJobs();
    if (modelId) {
      jobs = jobs.filter((j) => j.modelId === modelId);
    }
    return jobs.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  /**
   * Cancel training job
   */
  async cancelTraining(jobId: string): Promise<boolean> {
    const job = store.getTrainingJob(jobId);
    if (!job) return false;

    if (job.status === "running" || job.status === "pending") {
      job.status = "cancelled";
      job.completedAt = new Date().toISOString();
      job.logs.push({
        timestamp: new Date().toISOString(),
        level: "info",
        message: "Training job cancelled",
      });
      store.setTrainingJob(job);
      return true;
    }
    return false;
  }

  /**
   * Run training (mock implementation)
   */
  private async runTraining(job: TrainingJob): Promise<void> {
    // Update to running
    job.status = "running";
    job.startedAt = new Date().toISOString();
    job.logs.push({
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Training started",
    });
    store.setTrainingJob(job);

    // Simulate training epochs
    const totalEpochs = job.config.trainingConfig.epochs;

    for (let epoch = 1; epoch <= totalEpochs; epoch++) {
      // Check if cancelled
      const currentJob = store.getTrainingJob(job.id);
      if (currentJob?.status === "cancelled") {
        return;
      }

      // Simulate epoch duration
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Update progress
      job.progress = {
        currentEpoch: epoch,
        totalEpochs,
        percentComplete: (epoch / totalEpochs) * 100,
        loss: Math.random() * 0.5 * (1 - epoch / totalEpochs) + 0.05,
        validationLoss: Math.random() * 0.5 * (1 - epoch / totalEpochs) + 0.08,
      };
      job.resourceUsage = {
        cpuPercent: 50 + Math.random() * 40,
        memoryUsed: 2 * 1024 * 1024 * 1024 + Math.random() * 1024 * 1024 * 1024,
      };

      job.logs.push({
        timestamp: new Date().toISOString(),
        level: "info",
        message: `Epoch ${epoch}/${totalEpochs} - Loss: ${job.progress.loss?.toFixed(4)}, Val Loss: ${job.progress.validationLoss?.toFixed(4)}`,
      });

      store.setTrainingJob(job);
    }

    // Complete training
    job.status = "completed";
    job.completedAt = new Date().toISOString();
    job.logs.push({
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Training completed successfully",
    });
    store.setTrainingJob(job);

    // Update model with results
    const model = store.getModel(job.modelId);
    if (model) {
      model.status = "ready";
      model.trainingInfo = {
        ...model.trainingInfo,
        trainingDuration:
          (new Date(job.completedAt!).getTime() -
            new Date(job.startedAt!).getTime()) /
          1000,
        epochs: totalEpochs,
        completedAt: job.completedAt,
      };
      model.metrics = {
        accuracy: 0.85 + Math.random() * 0.1,
        precision: 0.82 + Math.random() * 0.1,
        recall: 0.8 + Math.random() * 0.1,
        f1Score: 0.81 + Math.random() * 0.1,
      };
      model.updatedAt = new Date().toISOString();
      store.setModel(model);
    }
  }

  // ============================================================================
  // DEPLOYMENT OPERATIONS
  // ============================================================================

  /**
   * Deploy model
   */
  async deployModel(
    modelId: string,
    environment: "development" | "staging" | "production" = "development",
  ): Promise<MLModel> {
    const model = store.getModel(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    if (model.status !== "ready") {
      throw new Error("Model must be in ready status to deploy");
    }

    model.deployment = {
      isDeployed: true,
      environment,
      endpoint: `/api/ml/predict/${modelId}`,
      deployedAt: new Date().toISOString(),
      replicas: 1,
    };
    model.status = "deployed";
    model.updatedAt = new Date().toISOString();

    store.setModel(model);
    return model;
  }

  /**
   * Undeploy model
   */
  async undeployModel(modelId: string): Promise<MLModel> {
    const model = store.getModel(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    model.deployment.isDeployed = false;
    model.status = "ready";
    model.updatedAt = new Date().toISOString();

    store.setModel(model);
    return model;
  }

  // ============================================================================
  // PREDICTION
  // ============================================================================

  /**
   * Make a prediction using deployed model
   */
  async predict(
    modelId: string,
    input: Record<string, any>,
  ): Promise<{
    output: any;
    confidence?: number;
    latency: number;
  }> {
    const model = store.getModel(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    if (!model.deployment.isDeployed) {
      throw new Error("Model is not deployed");
    }

    const startTime = Date.now();

    // Mock prediction - would call actual model in production
    const output = this.mockPredict(model, input);

    const latency = Date.now() - startTime;

    // Log prediction
    store.addPrediction({
      modelId,
      input,
      output,
      timestamp: new Date().toISOString(),
    });

    return {
      output,
      confidence: 0.85 + Math.random() * 0.1,
      latency,
    };
  }

  private mockPredict(model: MLModel, input: Record<string, any>): any {
    switch (model.type) {
      case "classification":
        return {
          class: Math.random() > 0.5 ? "positive" : "negative",
          probabilities: { positive: Math.random(), negative: Math.random() },
        };
      case "regression":
        return { value: Math.random() * 100 };
      case "anomaly_detection":
        return { isAnomaly: Math.random() > 0.9, score: Math.random() };
      default:
        return { result: "mock_prediction" };
    }
  }

  // ============================================================================
  // A/B TESTING
  // ============================================================================

  /**
   * Start A/B test between two models
   */
  async startABTest(
    name: string,
    controlModelId: string,
    treatmentModelId: string,
    config?: {
      trafficSplit?: number;
      minimumSampleSize?: number;
      confidenceLevel?: number;
    },
  ): Promise<ABTest> {
    const control = store.getModel(controlModelId);
    const treatment = store.getModel(treatmentModelId);

    if (!control || !treatment) {
      throw new Error("Both control and treatment models must exist");
    }

    if (!control.deployment.isDeployed || !treatment.deployment.isDeployed) {
      throw new Error("Both models must be deployed");
    }

    const test: ABTest = {
      id: generateId("abtest"),
      name,
      description: `A/B test comparing ${control.name} vs ${treatment.name}`,
      controlModelId,
      treatmentModelId,
      trafficSplit: config?.trafficSplit ?? 50,
      minimumSampleSize: config?.minimumSampleSize ?? 1000,
      confidenceLevel: config?.confidenceLevel ?? 0.95,
      status: "running",
      startedAt: new Date().toISOString(),
    };

    store.setABTest(test);
    return test;
  }

  /**
   * Get A/B test results
   */
  async getABTestResults(testId: string): Promise<ABTest | null> {
    const test = store.getABTest(testId);
    if (!test) return null;

    // Calculate results (mock)
    const controlPredictions = store.getPredictions(test.controlModelId);
    const treatmentPredictions = store.getPredictions(test.treatmentModelId);

    if (
      controlPredictions.length >= test.minimumSampleSize &&
      treatmentPredictions.length >= test.minimumSampleSize
    ) {
      test.results = {
        controlSamples: controlPredictions.length,
        treatmentSamples: treatmentPredictions.length,
        controlMetrics: { accuracy: 0.82, latency: 45 },
        treatmentMetrics: { accuracy: 0.85, latency: 42 },
        statisticalSignificance: true,
        pValue: 0.03,
        confidenceInterval: [0.01, 0.05],
        winner: "treatment",
        recommendation:
          "Treatment model shows significant improvement. Consider promoting to production.",
      };

      if (test.status === "running") {
        test.status = "completed";
        test.endedAt = new Date().toISOString();
      }
    }

    store.setABTest(test);
    return test;
  }

  /**
   * Stop A/B test
   */
  async stopABTest(testId: string): Promise<ABTest | null> {
    const test = store.getABTest(testId);
    if (!test) return null;

    test.status = "cancelled";
    test.endedAt = new Date().toISOString();
    store.setABTest(test);
    return test;
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get registry statistics
   */
  async getStatistics(): Promise<{
    totalModels: number;
    modelsByType: Record<ModelType, number>;
    modelsByStatus: Record<ModelStatus, number>;
    deployedModels: number;
    activeTrainingJobs: number;
    activeABTests: number;
    totalPredictions: number;
  }> {
    const models = store.getAllModels();
    const jobs = store.getAllTrainingJobs();
    const tests = store.getAllABTests();

    const modelsByType: Record<string, number> = {};
    const modelsByStatus: Record<string, number> = {};

    for (const model of models) {
      modelsByType[model.type] = (modelsByType[model.type] || 0) + 1;
      modelsByStatus[model.status] = (modelsByStatus[model.status] || 0) + 1;
    }

    return {
      totalModels: models.length,
      modelsByType: modelsByType as Record<ModelType, number>,
      modelsByStatus: modelsByStatus as Record<ModelStatus, number>,
      deployedModels: models.filter((m) => m.deployment.isDeployed).length,
      activeTrainingJobs: jobs.filter((j) => j.status === "running").length,
      activeABTests: tests.filter((t) => t.status === "running").length,
      totalPredictions: 0, // Would track in real implementation
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const mlModelRegistry = new MLModelRegistry();
export const mlRegistry = mlModelRegistry; // Alias for backward compatibility
export default mlModelRegistry;
