/**
 * comparison.types.ts
 *
 * Type definitions for the Contract Comparison Feature
 */

export interface ContractDiff {
    clauseType: string;
    contract1: {
        text: string;
        riskLevel: string;
    } | null;
    contract2: {
        text: string;
        riskLevel: string;
    } | null;
    similarity: number; // 0-1, where 1 is identical
    category: 'added' | 'removed' | 'modified' | 'similar';
}

export interface ComparisonReport {
    contractId1: string;
    contractId2: string;
    contract1Title: string;
    contract2Title: string;
    totalClauses1: number;
    totalClauses2: number;
    commonClauses: number;
    uniqueToClauses1: number;
    uniqueToClauses2: number;
    riskDifference: number;
    diffs: ContractDiff[];
    summary: {
        highRiskDifferences: number;
        mediumRiskDifferences: number;
        lowRiskDifferences: number;
        recommendations: string[];
    };
    createdAt: Date;
}

export interface ComparisonOptions {
    includeMetrics?: boolean;
    includeSimilarityScores?: boolean;
    riskThreshold?: number;
}
