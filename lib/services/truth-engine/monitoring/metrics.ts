/**
 * Truth Engine Monitoring & Metrics
 * Track performance, usage, and errors
 */

export interface TruthEngineMetrics {
  eventsRecorded: number;
  eventsRecordedToday: number;
  evidenceRecorded: number;
  evidenceRecordedToday: number;
  reviewsCreated: number;
  reviewsCreatedToday: number;
  kpisCalculated: number;
  kpisCalculatedToday: number;
  boardBriefsGenerated: number;
  boardBriefsGeneratedToday: number;
  averageConfidenceScore: number;
  lowConfidenceEvents: number;
  eventsWithoutEvidence: number;
  averageReviewDuration: number;
  errors: number;
  errorsToday: number;
  lastUpdated: Date | string;
}

class TruthEngineMetricsCollector {
  private metrics: TruthEngineMetrics = {
    eventsRecorded: 0,
    eventsRecordedToday: 0,
    evidenceRecorded: 0,
    evidenceRecordedToday: 0,
    reviewsCreated: 0,
    reviewsCreatedToday: 0,
    kpisCalculated: 0,
    kpisCalculatedToday: 0,
    boardBriefsGenerated: 0,
    boardBriefsGeneratedToday: 0,
    averageConfidenceScore: 0,
    lowConfidenceEvents: 0,
    eventsWithoutEvidence: 0,
    averageReviewDuration: 0,
    errors: 0,
    errorsToday: 0,
    lastUpdated: new Date().toISOString(),
  };

  private confidenceScores: number[] = [];
  private reviewDurations: number[] = [];
  private lastResetDate: string = new Date().toISOString().split("T")[0];

  /**
   * Record event
   */
  recordEvent(confidenceScore: number, hasEvidence: boolean): void {
    this.metrics.eventsRecorded++;
    this.metrics.eventsRecordedToday++;

    this.confidenceScores.push(confidenceScore);
    if (confidenceScore < 0.7) {
      this.metrics.lowConfidenceEvents++;
    }

    if (!hasEvidence) {
      this.metrics.eventsWithoutEvidence++;
    }

    this.updateAverageConfidence();
    this.checkDailyReset();
  }

  /**
   * Record evidence
   */
  recordEvidence(): void {
    this.metrics.evidenceRecorded++;
    this.metrics.evidenceRecordedToday++;
    this.checkDailyReset();
  }

  /**
   * Record review
   */
  recordReview(duration: number): void {
    this.metrics.reviewsCreated++;
    this.metrics.reviewsCreatedToday++;
    this.reviewDurations.push(duration);
    this.updateAverageReviewDuration();
    this.checkDailyReset();
  }

  /**
   * Record KPI calculation
   */
  recordKPICalculation(): void {
    this.metrics.kpisCalculated++;
    this.metrics.kpisCalculatedToday++;
    this.checkDailyReset();
  }

  /**
   * Record board brief
   */
  recordBoardBrief(): void {
    this.metrics.boardBriefsGenerated++;
    this.metrics.boardBriefsGeneratedToday++;
    this.checkDailyReset();
  }

  /**
   * Record error
   */
  recordError(): void {
    this.metrics.errors++;
    this.metrics.errorsToday++;
    this.checkDailyReset();
  }

  /**
   * Get current metrics
   */
  getMetrics(): TruthEngineMetrics {
    this.metrics.lastUpdated = new Date().toISOString();
    return { ...this.metrics };
  }

  /**
   * Reset daily metrics
   */
  private checkDailyReset(): void {
    const today = new Date().toISOString().split("T")[0];
    if (today !== this.lastResetDate) {
      this.metrics.eventsRecordedToday = 0;
      this.metrics.evidenceRecordedToday = 0;
      this.metrics.reviewsCreatedToday = 0;
      this.metrics.kpisCalculatedToday = 0;
      this.metrics.boardBriefsGeneratedToday = 0;
      this.metrics.errorsToday = 0;
      this.lastResetDate = today;
    }
  }

  /**
   * Update average confidence score
   */
  private updateAverageConfidence(): void {
    if (this.confidenceScores.length > 0) {
      const sum = this.confidenceScores.reduce((a, b) => a + b, 0);
      this.metrics.averageConfidenceScore = sum / this.confidenceScores.length;

      // Keep only last 1000 scores for memory efficiency
      if (this.confidenceScores.length > 1000) {
        this.confidenceScores = this.confidenceScores.slice(-1000);
      }
    }
  }

  /**
   * Update average review duration
   */
  private updateAverageReviewDuration(): void {
    if (this.reviewDurations.length > 0) {
      const sum = this.reviewDurations.reduce((a, b) => a + b, 0);
      this.metrics.averageReviewDuration = sum / this.reviewDurations.length;

      // Keep only last 100 durations
      if (this.reviewDurations.length > 100) {
        this.reviewDurations = this.reviewDurations.slice(-100);
      }
    }
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = {
      eventsRecorded: 0,
      eventsRecordedToday: 0,
      evidenceRecorded: 0,
      evidenceRecordedToday: 0,
      reviewsCreated: 0,
      reviewsCreatedToday: 0,
      kpisCalculated: 0,
      kpisCalculatedToday: 0,
      boardBriefsGenerated: 0,
      boardBriefsGeneratedToday: 0,
      averageConfidenceScore: 0,
      lowConfidenceEvents: 0,
      eventsWithoutEvidence: 0,
      averageReviewDuration: 0,
      errors: 0,
      errorsToday: 0,
      lastUpdated: new Date().toISOString(),
    };
    this.confidenceScores = [];
    this.reviewDurations = [];
  }
}

export const truthEngineMetrics = new TruthEngineMetricsCollector();
