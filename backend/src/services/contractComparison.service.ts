/**
 * contractComparison.service.ts
 *
 * NEW FEATURE: Contract Comparison Engine
 * Compares two contracts side-by-side and identifies differences
 * 
 * This is an original enhancement that:
 * - Performs deep structural comparison
 * - Highlights clause differences
 * - Identifies missing clauses
 * - Compares risk profiles
 * - Generates comparison reports
 */

import { prisma } from '@/db/prisma.js';
import { getRedis } from '@/lib/redis.js';
import { createLogger } from '@/lib/logger.js';
import type { Contract, Clause } from '@prisma/client';

const log = createLogger('contractComparison.service');
const redis = getRedis();

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

/**
 * Compare two contracts and return detailed differences
 */
export async function compareContracts(
    contractId1: string,
    contractId2: string,
    orgId: string,
): Promise<ComparisonReport> {
    // Check cache first
    const cacheKey = `comparison:${[contractId1, contractId2].sort().join(':')}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
        log.debug({ contractId1, contractId2 }, 'Returning cached comparison');
        return JSON.parse(cached) as ComparisonReport;
    }

    // Fetch contracts
    const [contract1, contract2] = await Promise.all([
        prisma.contract.findFirst({
            where: { id: contractId1, orgId },
            include: { clauses: true },
        }),
        prisma.contract.findFirst({
            where: { id: contractId2, orgId },
            include: { clauses: true },
        }),
    ]);

    if (!contract1 || !contract2) {
        throw new Error('One or both contracts not found');
    }

    // Compute differences
    const diffs = computeDifferences(contract1.clauses, contract2.clauses);
    
    // Calculate metrics
    const commonClauses = diffs.filter(d => d.category === 'similar').length;
    const uniqueToClauses1 = diffs.filter(d => d.category === 'removed').length;
    const uniqueToClauses2 = diffs.filter(d => d.category === 'added').length;

    // Generate recommendations
    const recommendations = generateRecommendations(diffs, contract1, contract2);

    // Risk comparison
    const riskDifference = (contract1.riskScore || 0) - (contract2.riskScore || 0);

    const report: ComparisonReport = {
        contractId1,
        contractId2,
        contract1Title: contract1.title,
        contract2Title: contract2.title,
        totalClauses1: contract1.clauses.length,
        totalClauses2: contract2.clauses.length,
        commonClauses,
        uniqueToClauses1,
        uniqueToClauses2,
        riskDifference,
        diffs,
        summary: {
            highRiskDifferences: diffs.filter(d => d.contract1?.riskLevel === 'high' || d.contract2?.riskLevel === 'high').length,
            mediumRiskDifferences: diffs.filter(d => d.contract1?.riskLevel === 'medium' || d.contract2?.riskLevel === 'medium').length,
            lowRiskDifferences: diffs.filter(d => d.contract1?.riskLevel === 'low' || d.contract2?.riskLevel === 'low').length,
            recommendations,
        },
        createdAt: new Date(),
    };

    // Cache for 24 hours
    await redis.setex(cacheKey, 86400, JSON.stringify(report));

    log.info(
        { contractId1, contractId2, commonClauses, differences: diffs.length },
        'Comparison completed'
    );

    return report;
}

/**
 * Compute differences between two sets of clauses
 */
function computeDifferences(clauses1: Clause[], clauses2: Clause[]): ContractDiff[] {
    const diffs: ContractDiff[] = [];
    const processed = new Set<string>();

    // Compare clauses from contract1 to contract2
    for (const clause1 of clauses1) {
        const match = clauses2.find(c => 
            c.type === clause1.type && 
            calculateSimilarity(c.text, clause1.text) > 0.7
        );

        if (match) {
            // Similar clause found
            processed.add(match.id);
            const similarity = calculateSimilarity(match.text, clause1.text);
            
            diffs.push({
                clauseType: clause1.type,
                contract1: {
                    text: clause1.text.substring(0, 200),
                    riskLevel: clause1.riskLevel || 'low',
                },
                contract2: {
                    text: match.text.substring(0, 200),
                    riskLevel: match.riskLevel || 'low',
                },
                similarity,
                category: similarity === 1 ? 'similar' : 'modified',
            });
        } else {
            // Unique to contract1
            diffs.push({
                clauseType: clause1.type,
                contract1: {
                    text: clause1.text.substring(0, 200),
                    riskLevel: clause1.riskLevel || 'low',
                },
                contract2: null,
                similarity: 0,
                category: 'removed',
            });
        }
    }

    // Find clauses unique to contract2
    for (const clause2 of clauses2) {
        if (!processed.has(clause2.id)) {
            diffs.push({
                clauseType: clause2.type,
                contract1: null,
                contract2: {
                    text: clause2.text.substring(0, 200),
                    riskLevel: clause2.riskLevel || 'low',
                },
                similarity: 0,
                category: 'added',
            });
        }
    }

    return diffs.sort((a, b) => a.similarity - b.similarity);
}

/**
 * Simple string similarity calculation (0-1)
 * In production, use more sophisticated methods like cosine similarity with embeddings
 */
function calculateSimilarity(text1: string, text2: string): number {
    const normalize = (t: string) => t.toLowerCase().trim();
    const t1 = normalize(text1);
    const t2 = normalize(text2);

    if (t1 === t2) return 1;
    if (t1.length === 0 || t2.length === 0) return 0;

    // Levenshtein-like comparison (simplified)
    const minLen = Math.min(t1.length, t2.length);
    const maxLen = Math.max(t1.length, t2.length);
    let matches = 0;

    for (let i = 0; i < minLen; i++) {
        if (t1[i] === t2[i]) matches++;
    }

    return matches / maxLen;
}

/**
 * Generate recommendations based on comparison
 */
function generateRecommendations(
    diffs: ContractDiff[],
    contract1: Contract,
    contract2: Contract,
): string[] {
    const recommendations: string[] = [];

    // High-risk differences
    const highRiskDiffs = diffs.filter(
        d => d.contract1?.riskLevel === 'high' || d.contract2?.riskLevel === 'high'
    );
    
    if (highRiskDiffs.length > 0) {
        recommendations.push(
            `⚠️ Found ${highRiskDiffs.length} high-risk clause difference(s). Review carefully before proceeding.`
        );
    }

    // Missing favorable clauses
    const favorableClauses = ['limitation-of-liability', 'indemnification', 'confidentiality'];
    const missingFavorable = diffs.filter(
        d => d.category === 'removed' && favorableClauses.includes(d.clauseType.toLowerCase())
    );
    
    if (missingFavorable.length > 0) {
        recommendations.push(
            `📋 Contract 1 is missing ${missingFavorable.length} favorable clause(s) found in Contract 2`
        );
    }

    // Risk score difference
    if (Math.abs(contract1.riskScore - contract2.riskScore) > 20) {
        const riskier = contract1.riskScore > contract2.riskScore ? 'Contract 1' : 'Contract 2';
        recommendations.push(
            `📊 Significant risk difference detected. ${riskier} is substantially higher risk.`
        );
    }

    return recommendations;
}

/**
 * Get all comparison results for a contract (for audit/history)
 */
export async function getContractComparisonHistory(
    contractId: string,
    orgId: string,
    limit = 10,
) {
    // This would query a contract_comparisons table if persisted
    // For now, return recent comparisons from Redis
    
    const pattern = `comparison:*${contractId}*`;
    const keys = await redis.keys(pattern);
    
    return keys.slice(0, limit).map(key => {
        const data = redis.get(key);
        return data ? JSON.parse(data as string) : null;
    }).filter(Boolean);
}
