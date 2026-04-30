/**
 * Motivation & Quotes Module
 *
 * Provides inspirational quotes, data importance messages, and task completion analytics
 * Integrated throughout the system to motivate users and add value
 */

export interface Quote {
  id: string;
  text: string;
  author?: string;
  category:
    | "data"
    | "productivity"
    | "sustainability"
    | "resilience"
    | "innovation"
    | "quality";
  context:
    | "task_complete"
    | "job_start"
    | "job_complete"
    | "milestone"
    | "error_recovery"
    | "daily";
  impact?: "positive" | "neutral" | "motivational";
}

export interface TaskAnalytics {
  taskId: string;
  taskName: string;
  timeSaved: number; // milliseconds
  timeSavedPercentage: number;
  accuracy: number; // 0-100
  timestamp: Date;
  positiveConsequences: string[];
  negativeConsequences: string[];
  sustainabilityImpact?: {
    carbonSaved?: number; // kg CO2
    resourcesSaved?: number;
    efficiencyGain?: number; // percentage
  };
  resilienceImpact?: {
    riskReduced?: number; // percentage
    reliabilityGained?: number; // percentage
  };
}

class MotivationService {
  private quotes: Quote[] = [
    // Data Importance
    {
      id: "data-1",
      text: "Data is the new oil, but unlike oil, data becomes more valuable when shared and analyzed.",
      author: "Clive Humby",
      category: "data",
      context: "job_complete",
      impact: "positive",
    },
    {
      id: "data-2",
      text: "Without data, you're just another person with an opinion.",
      author: "W. Edwards Deming",
      category: "data",
      context: "task_complete",
      impact: "motivational",
    },
    {
      id: "data-3",
      text: "The goal is to turn data into information, and information into insight.",
      author: "Carly Fiorina",
      category: "data",
      context: "job_start",
      impact: "positive",
    },
    {
      id: "data-4",
      text: "Data-driven decisions are the foundation of modern business excellence.",
      category: "data",
      context: "milestone",
      impact: "positive",
    },

    // Productivity
    {
      id: "prod-1",
      text: "Efficiency is doing things right; effectiveness is doing the right things.",
      author: "Peter Drucker",
      category: "productivity",
      context: "task_complete",
      impact: "motivational",
    },
    {
      id: "prod-2",
      text: "Time saved is value created. Every optimization compounds.",
      category: "productivity",
      context: "job_complete",
      impact: "positive",
    },
    {
      id: "prod-3",
      text: "Automation frees human creativity for what truly matters.",
      category: "productivity",
      context: "job_start",
      impact: "positive",
    },

    // Sustainability
    {
      id: "sust-1",
      text: "Sustainability is not about sacrifice, it's about smarter choices that benefit everyone.",
      category: "sustainability",
      context: "task_complete",
      impact: "positive",
    },
    {
      id: "sust-2",
      text: "Every efficient process reduces waste and builds a better future.",
      category: "sustainability",
      context: "job_complete",
      impact: "positive",
    },
    {
      id: "sust-3",
      text: "Optimization today creates resources for tomorrow.",
      category: "sustainability",
      context: "milestone",
      impact: "positive",
    },

    // Resilience
    {
      id: "res-1",
      text: "Resilience is built through preparation, not reaction.",
      category: "resilience",
      context: "error_recovery",
      impact: "motivational",
    },
    {
      id: "res-2",
      text: "Robust systems handle uncertainty with grace and continue delivering value.",
      category: "resilience",
      context: "job_complete",
      impact: "positive",
    },
    {
      id: "res-3",
      text: "Every challenge overcome strengthens the foundation for future success.",
      category: "resilience",
      context: "error_recovery",
      impact: "motivational",
    },

    // Innovation
    {
      id: "inn-1",
      text: "Innovation distinguishes between a leader and a follower.",
      author: "Steve Jobs",
      category: "innovation",
      context: "milestone",
      impact: "motivational",
    },
    {
      id: "inn-2",
      text: "The best way to predict the future is to create it.",
      author: "Peter Drucker",
      category: "innovation",
      context: "job_start",
      impact: "positive",
    },

    // Quality
    {
      id: "qual-1",
      text: "Quality is never an accident; it is always the result of high intention.",
      author: "John Ruskin",
      category: "quality",
      context: "task_complete",
      impact: "positive",
    },
    {
      id: "qual-2",
      text: "Excellence is not a skill, it's an attitude that drives continuous improvement.",
      category: "quality",
      context: "job_complete",
      impact: "motivational",
    },
  ];

  /**
   * Get a random quote for context
   */
  getQuote(context: Quote["context"], category?: Quote["category"]): Quote {
    let filtered = this.quotes.filter((q) => q.context === context);

    if (category) {
      filtered = filtered.filter((q) => q.category === category);
    }

    if (filtered.length === 0) {
      filtered = this.quotes.filter((q) => q.context === context);
    }

    if (filtered.length === 0) {
      filtered = this.quotes;
    }

    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  /**
   * Get quote for task completion with analytics
   */
  getTaskCompletionMessage(analytics: TaskAnalytics): {
    quote: Quote;
    message: string;
    highlights: string[];
  } {
    const quote = this.getQuote("task_complete");

    const highlights: string[] = [];

    if (analytics.timeSaved > 0) {
      const minutes = Math.round(analytics.timeSaved / 60000);
      highlights.push(`⏱️ ${minutes} minutes saved`);
      if (analytics.timeSavedPercentage > 0) {
        highlights.push(
          `📊 ${analytics.timeSavedPercentage.toFixed(0)}% faster`,
        );
      }
    }

    if (analytics.accuracy > 0) {
      highlights.push(`🎯 ${analytics.accuracy.toFixed(0)}% accuracy`);
    }

    if (analytics.sustainabilityImpact) {
      if (analytics.sustainabilityImpact.carbonSaved) {
        highlights.push(
          `🌱 ${analytics.sustainabilityImpact.carbonSaved.toFixed(2)} kg CO₂ saved`,
        );
      }
      if (analytics.sustainabilityImpact.efficiencyGain) {
        highlights.push(
          `⚡ ${analytics.sustainabilityImpact.efficiencyGain.toFixed(0)}% more efficient`,
        );
      }
    }

    if (analytics.resilienceImpact) {
      if (analytics.resilienceImpact.riskReduced) {
        highlights.push(
          `🛡️ ${analytics.resilienceImpact.riskReduced.toFixed(0)}% risk reduction`,
        );
      }
    }

    const message = `Great work! ${quote.text}`;

    return { quote, message, highlights };
  }

  /**
   * Calculate task analytics
   */
  calculateTaskAnalytics(
    taskName: string,
    startTime: Date,
    endTime: Date,
    estimatedTime?: number,
    accuracy?: number,
    metadata?: Record<string, any>,
  ): TaskAnalytics {
    const duration = endTime.getTime() - startTime.getTime();
    const timeSaved = estimatedTime ? Math.max(0, estimatedTime - duration) : 0;
    const timeSavedPercentage = estimatedTime
      ? (timeSaved / estimatedTime) * 100
      : 0;

    // Calculate positive consequences
    const positiveConsequences: string[] = [];
    if (timeSaved > 0) {
      positiveConsequences.push(
        `Saved ${Math.round(timeSaved / 60000)} minutes`,
      );
    }
    if (accuracy && accuracy >= 95) {
      positiveConsequences.push("High accuracy achieved");
    }
    if (metadata?.itemsProcessed) {
      positiveConsequences.push(`Processed ${metadata.itemsProcessed} items`);
    }

    // Calculate negative consequences (missed opportunities)
    const negativeConsequences: string[] = [];
    if (timeSaved === 0 && estimatedTime) {
      negativeConsequences.push("Could optimize further for time savings");
    }
    if (accuracy && accuracy < 90) {
      negativeConsequences.push("Consider reviewing for accuracy improvements");
    }

    // Sustainability impact (example calculations)
    const sustainabilityImpact = {
      carbonSaved: (timeSaved / 3600000) * 0.5, // Rough estimate: 0.5kg CO2 per hour saved
      efficiencyGain: timeSavedPercentage,
    };

    // Resilience impact
    const resilienceImpact = {
      riskReduced: accuracy ? Math.min(accuracy / 10, 10) : 0,
      reliabilityGained:
        timeSavedPercentage > 0 ? Math.min(timeSavedPercentage / 10, 10) : 0,
    };

    return {
      taskId: `task-${Date.now()}`,
      taskName,
      timeSaved,
      timeSavedPercentage,
      accuracy: accuracy || 100,
      timestamp: endTime,
      positiveConsequences,
      negativeConsequences,
      sustainabilityImpact,
      resilienceImpact,
    };
  }

  /**
   * Get daily motivation quote
   */
  getDailyQuote(): Quote {
    return this.getQuote("daily");
  }
}

export const motivationService = new MotivationService();
