/**
 * analytics.types.ts
 *
 * Type definitions for the Analytics Feature
 */

export interface DashboardSummary {
    totalContracts: number;
    highRiskContracts: number;
    mediumRiskContracts: number;
    lowRiskContracts: number;
    averageRiskScore: number;
    totalClausesAnalyzed: number;
    contractsAnalyzedToday: number;
    averageAnalysisTime: number;
    lastUpdated: Date;
}

export interface RiskDistribution {
    high: number;
    medium: number;
    low: number;
    none: number;
}

export interface TrendDataPoint {
    date: string;
    contractsAdded: number;
    riskTrend: number;
    avgRiskScore: number;
}

export interface ClauseAnalysis {
    clauseType: string;
    frequency: number;
    averageRiskLevel: string;
    topKeywords: string[];
}

export interface AnalyticsReport {
    period: {
        startDate: Date;
        endDate: Date;
    };
    summary: DashboardSummary;
    riskDistribution: RiskDistribution;
    clauseAnalysis: ClauseAnalysis[];
    generatedAt: Date;
}
