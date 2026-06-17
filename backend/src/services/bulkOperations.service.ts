/**
 * bulkOperations.service.ts
 *
 * NEW FEATURE: Bulk Operations
 * Efficiently handle batch processing of multiple contracts
 * 
 * Features:
 * - Bulk file upload and processing
 * - Progress tracking
 * - Batch job management
 * - Error recovery
 * - Results aggregation
 */

import { prisma } from '@/db/prisma.js';
import { getRedis } from '@/lib/redis.js';
import { createLogger } from '@/lib/logger.js';
import { v4 as uuidv4 } from 'uuid';

const log = createLogger('bulkOperations.service');
const redis = getRedis();

export enum BulkJobStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
}

export interface BulkJob {
    id: string;
    orgId: string;
    status: BulkJobStatus;
    totalFiles: number;
    processedFiles: number;
    failedFiles: number;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    results?: BulkJobResult;
}

export interface BulkJobResult {
    successCount: number;
    failureCount: number;
    contractIds: string[];
    errors: BulkProcessingError[];
    riskSummary: {
        highRisk: number;
        mediumRisk: number;
        lowRisk: number;
    };
    avgRiskScore: number;
    processingTimeMs: number;
}

export interface BulkProcessingError {
    fileName: string;
    error: string;
    timestamp: Date;
}

/**
 * Create a new bulk processing job
 */
export async function createBulkJob(
    orgId: string,
    totalFiles: number,
): Promise<BulkJob> {
    const jobId = uuidv4();
    
    const job: BulkJob = {
        id: jobId,
        orgId,
        status: BulkJobStatus.PENDING,
        totalFiles,
        processedFiles: 0,
        failedFiles: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    // Store job metadata in Redis
    await redis.setex(
        `bulk-job:${jobId}`,
        604800, // 7 days
        JSON.stringify(job)
    );

    // Store in list of user's bulk jobs
    await redis.lpush(`bulk-jobs:${orgId}`, jobId);

    log.info({ jobId, orgId, totalFiles }, 'Bulk job created');

    return job;
}

/**
 * Get bulk job status and progress
 */
export async function getBulkJobStatus(jobId: string): Promise<BulkJob | null> {
    const data = await redis.get(`bulk-job:${jobId}`);
    
    if (!data) {
        return null;
    }

    return JSON.parse(data) as BulkJob;
}

/**
 * Update bulk job progress
 */
export async function updateBulkJobProgress(
    jobId: string,
    processedCount: number,
    failedCount: number,
    status?: BulkJobStatus,
): Promise<BulkJob> {
    const job = await getBulkJobStatus(jobId);
    
    if (!job) {
        throw new Error('Job not found');
    }

    const updated: BulkJob = {
        ...job,
        processedFiles: processedCount,
        failedFiles: failedCount,
        status: status || job.status,
        updatedAt: new Date(),
    };

    if (status === BulkJobStatus.COMPLETED) {
        updated.completedAt = new Date();
    }

    await redis.setex(
        `bulk-job:${jobId}`,
        604800,
        JSON.stringify(updated)
    );

    return updated;
}

/**
 * Complete bulk job with results
 */
export async function completeBulkJob(
    jobId: string,
    results: BulkJobResult,
): Promise<BulkJob> {
    const job = await getBulkJobStatus(jobId);
    
    if (!job) {
        throw new Error('Job not found');
    }

    const completed: BulkJob = {
        ...job,
        status: BulkJobStatus.COMPLETED,
        results,
        completedAt: new Date(),
        updatedAt: new Date(),
    };

    await redis.setex(
        `bulk-job:${jobId}`,
        604800,
        JSON.stringify(completed)
    );

    // Also cache results separately for quick access
    await redis.setex(
        `bulk-results:${jobId}`,
        604800,
        JSON.stringify(results)
    );

    log.info(
        { jobId, success: results.successCount, failed: results.failureCount },
        'Bulk job completed'
    );

    return completed;
}

/**
 * Fail bulk job
 */
export async function failBulkJob(
    jobId: string,
    error: string,
): Promise<BulkJob> {
    const job = await getBulkJobStatus(jobId);
    
    if (!job) {
        throw new Error('Job not found');
    }

    const failed: BulkJob = {
        ...job,
        status: BulkJobStatus.FAILED,
        completedAt: new Date(),
        updatedAt: new Date(),
    };

    await redis.setex(
        `bulk-job:${jobId}`,
        604800,
        JSON.stringify(failed)
    );

    log.error({ jobId, error }, 'Bulk job failed');

    return failed;
}

/**
 * Get all bulk jobs for organization
 */
export async function getOrgBulkJobs(
    orgId: string,
    limit = 20,
): Promise<BulkJob[]> {
    const jobIds = await redis.lrange(`bulk-jobs:${orgId}`, 0, limit - 1);
    
    const jobs = await Promise.all(
        jobIds.map(id => getBulkJobStatus(id))
    );

    return jobs.filter(Boolean) as BulkJob[];
}

/**
 * Get bulk job results
 */
export async function getBulkJobResults(jobId: string): Promise<BulkJobResult | null> {
    const data = await redis.get(`bulk-results:${jobId}`);
    
    if (!data) {
        return null;
    }

    return JSON.parse(data) as BulkJobResult;
}

/**
 * Process single file in bulk job
 */
export async function processBulkFile(
    jobId: string,
    fileName: string,
    fileContent: Buffer,
): Promise<{ success: boolean; contractId?: string; error?: string }> {
    try {
        // Validate file
        if (!fileName.match(/\.(pdf|docx?)$/i)) {
            return {
                success: false,
                error: 'Invalid file type. Only PDF and DOCX files are supported.',
            };
        }

        if (fileContent.length > 50 * 1024 * 1024) { // 50MB limit
            return {
                success: false,
                error: 'File too large. Maximum 50MB allowed.',
            };
        }

        // In production, this would:
        // 1. Parse the file
        // 2. Extract text
        // 3. Send to LLM for analysis
        // 4. Create contract in database
        // 5. Return contract ID

        const contractId = uuidv4();
        
        log.debug({ jobId, fileName, contractId }, 'File processed');

        return {
            success: true,
            contractId,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        log.error({ jobId, fileName, error: message }, 'File processing failed');

        return {
            success: false,
            error: message,
        };
    }
}

/**
 * Calculate bulk job statistics
 */
export function calculateBulkStats(results: BulkJobResult) {
    return {
        totalProcessed: results.successCount + results.failureCount,
        successRate: results.successCount / (results.successCount + results.failureCount) * 100,
        highRiskPercentage: results.riskSummary.highRisk / results.successCount * 100,
        averageProcessingTimePerFile: results.processingTimeMs / (results.successCount + results.failureCount),
    };
}

/**
 * Clean up old bulk jobs (>30 days old)
 */
export async function cleanupOldBulkJobs(): Promise<number> {
    const pattern = 'bulk-job:*';
    const keys = await redis.keys(pattern);
    
    let cleaned = 0;

    for (const key of keys) {
        const ttl = await redis.ttl(key);
        // If TTL is less than 1 day, delete
        if (ttl > 0 && ttl < 86400) {
            await redis.del(key);
            cleaned++;
        }
    }

    log.info({ cleaned }, 'Cleaned up old bulk jobs');

    return cleaned;
}

/**
 * Generate bulk processing report
 */
export function generateBulkReport(job: BulkJob, results: BulkJobResult) {
    const stats = calculateBulkStats(results);
    
    return {
        jobId: job.id,
        period: {
            startedAt: job.createdAt,
            completedAt: job.completedAt,
            duration: job.completedAt 
                ? job.completedAt.getTime() - job.createdAt.getTime()
                : 0,
        },
        metrics: {
            totalFiles: job.totalFiles,
            processed: results.successCount,
            failed: results.failureCount,
            successRate: `${stats.successRate.toFixed(2)}%`,
        },
        riskAnalysis: {
            highRisk: results.riskSummary.highRisk,
            mediumRisk: results.riskSummary.mediumRisk,
            lowRisk: results.riskSummary.lowRisk,
            average: results.avgRiskScore.toFixed(2),
        },
        performance: {
            totalTimeMs: results.processingTimeMs,
            avgTimePerFileMs: stats.averageProcessingTimePerFile.toFixed(0),
        },
        createdContracts: results.contractIds,
        errors: results.errors,
    };
}
