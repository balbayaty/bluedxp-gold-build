/**
 * DMARC Monitoring Service - Type Definitions
 * Email deliverability tracking and domain reputation monitoring
 */

export type DMARCPolicy = "none" | "quarantine" | "reject";

export type DMARCResult =
  | "pass"
  | "fail"
  | "neutral"
  | "temperror"
  | "permerror";

export interface DMARCReport {
  id: string;
  tenantId: string;
  domain: string;
  reportId: string;
  organizationName: string;
  email: string;
  dateRange: {
    begin: Date;
    end: Date;
  };
  policy: {
    domain: string;
    adkim: "r" | "s";
    aspf: "r" | "s";
    p: DMARCPolicy;
    sp: DMARCPolicy;
    pct: number;
  };
  records: DMARCRecord[];
  createdAt: Date;
  processedAt?: Date;
}

export interface DMARCRecord {
  sourceIp: string;
  count: number;
  disposition: "none" | "quarantine" | "reject";
  dkimResult: DMARCResult;
  spfResult: DMARCResult;
  headerFrom: string;
  envelopeFrom?: string;
  authResults: {
    dkim?: {
      domain: string;
      result: DMARCResult;
      selector?: string;
    };
    spf?: {
      domain: string;
      result: DMARCResult;
      scope?: string;
    };
  };
}

export interface DMARCAggregate {
  domain: string;
  period: {
    start: Date;
    end: Date;
  };
  totalMessages: number;
  passed: number;
  failed: number;
  dispositionBreakdown: {
    none: number;
    quarantine: number;
    reject: number;
  };
  dkimBreakdown: {
    pass: number;
    fail: number;
    neutral: number;
  };
  spfBreakdown: {
    pass: number;
    fail: number;
    neutral: number;
  };
  topSources: Array<{
    sourceIp: string;
    count: number;
    passRate: number;
  }>;
}

export interface DomainReputation {
  domain: string;
  score: number; // 0-100
  status: "excellent" | "good" | "fair" | "poor" | "critical";
  factors: {
    dmarcPassRate: number;
    spfPassRate: number;
    dkimPassRate: number;
    spamComplaints: number;
    bounceRate: number;
    blacklistStatus: string[];
  };
  lastUpdated: Date;
}

export interface DMARCAlert {
  id: string;
  tenantId: string;
  domain: string;
  severity: "info" | "warning" | "critical";
  type:
    | "policy_violation"
    | "spoofing_attempt"
    | "low_pass_rate"
    | "blacklist_detection";
  message: string;
  details: Record<string, any>;
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}
