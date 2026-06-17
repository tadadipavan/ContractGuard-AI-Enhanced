/**
 * bulk.route.ts
 *
 * API Routes for Bulk Operations Feature (NEW)
 * 
 * Endpoints:
 * - POST /api/v1/contracts/bulk/upload - Start bulk upload
 * - GET /api/v1/contracts/bulk/:jobId/status - Check job status
 * - GET /api/v1/contracts/bulk/:jobId/results - Get job results
 * - GET /api/v1/contracts/bulk/jobs - List user's bulk jobs
 */

import type { FastifyInstance, MultipartFile } from 'fastify';
import {
    createBulkJob,
    getBulkJobStatus,
    getBulkJobResults,
    getOrgBulkJobs,
    generateBulkReport,
} from '@/services/bulkOperations.service.js';
import { authenticateUser } from '@/middleware/authenticate.js';
import { requireOrg } from '@/middleware/requireOrg.js';
import { createLogger } from '@/lib/logger.js';

const log = createLogger('bulk.route');

// ─── Routes ───────────────────────────────────────────────────

export async function setupBulkOperationRoutes(app: FastifyInstance) {
    /**
     * POST /api/v1/contracts/bulk/upload
     * Upload multiple files for bulk processing
     */
    app.post(
        '/api/v1/contracts/bulk/upload',
        {
            preHandler: [authenticateUser, requireOrg],
            schema: {
                description: 'Upload multiple contracts for bulk processing',
                tags: ['Bulk Operations'],
            },
        },
        async (req, reply) => {
            const orgId = req.orgId as string;

            try {
                const parts = req.parts();
                const files: Array<{ filename: string; buffer: Buffer }> = [];

                // Collect all files
                for await (const part of parts) {
                    if (part.type === 'file') {
                        const file = part as MultipartFile;
                        const buffer = await file.toBuffer();
                        files.push({
                            filename: file.filename,
                            buffer,
                        });
                    }
                }

                if (files.length === 0) {
                    return reply.code(400).send({
                        error: {
                            type: 'ValidationError',
                            title: 'No Files',
                            status: 400,
                            detail: 'Please upload at least one file',
                        },
                    });
                }

                // Validate file count
                if (files.length > 100) {
                    return reply.code(400).send({
                        error: {
                            type: 'ValidationError',
                            title: 'Too Many Files',
                            status: 400,
                            detail: 'Maximum 100 files per upload',
                        },
                    });
                }

                // Create bulk job
                const job = await createBulkJob(orgId, files.length);

                // Queue files for processing
                // In production, this would queue each file to a BullMQ job
                log.info(
                    { jobId: job.id, fileCount: files.length },
                    'Bulk upload started'
                );

                return reply.code(202).send({
                    success: true,
                    data: {
                        jobId: job.id,
                        status: job.status,
                        totalFiles: job.totalFiles,
                        message: 'Upload started. Check status for progress.',
                    },
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Upload failed';
                log.error({ error: message }, 'Bulk upload failed');

                throw error;
            }
        }
    );

    /**
     * GET /api/v1/contracts/bulk/:jobId/status
     * Check status of bulk processing job
     */
    app.get<{ Params: { jobId: string } }>(
        '/api/v1/contracts/bulk/:jobId/status',
        { preHandler: [authenticateUser, requireOrg] },
        async (req, reply) => {
            const { jobId } = req.params;

            try {
                const job = await getBulkJobStatus(jobId);

                if (!job) {
                    return reply.code(404).send({
                        error: {
                            type: 'NotFound',
                            title: 'Job Not Found',
                            status: 404,
                            detail: `Bulk job ${jobId} does not exist`,
                        },
                    });
                }

                return reply.code(200).send({
                    success: true,
                    data: {
                        jobId: job.id,
                        status: job.status,
                        progress: {
                            total: job.totalFiles,
                            processed: job.processedFiles,
                            failed: job.failedFiles,
                            percentage: Math.round(
                                ((job.processedFiles + job.failedFiles) / job.totalFiles) * 100
                            ),
                        },
                        createdAt: job.createdAt,
                        updatedAt: job.updatedAt,
                        completedAt: job.completedAt,
                    },
                });
            } catch (error) {
                throw error;
            }
        }
    );

    /**
     * GET /api/v1/contracts/bulk/:jobId/results
     * Get results from completed bulk job
     */
    app.get<{ Params: { jobId: string } }>(
        '/api/v1/contracts/bulk/:jobId/results',
        { preHandler: [authenticateUser, requireOrg] },
        async (req, reply) => {
            const { jobId } = req.params;

            try {
                const job = await getBulkJobStatus(jobId);

                if (!job) {
                    return reply.code(404).send({
                        error: {
                            type: 'NotFound',
                            title: 'Job Not Found',
                            status: 404,
                            detail: `Bulk job ${jobId} does not exist`,
                        },
                    });
                }

                if (job.status !== 'completed') {
                    return reply.code(400).send({
                        error: {
                            type: 'InvalidState',
                            title: 'Job Not Completed',
                            status: 400,
                            detail: `Job status is ${job.status}, not completed yet`,
                        },
                    });
                }

                const results = await getBulkJobResults(jobId);

                if (!results) {
                    return reply.code(404).send({
                        error: {
                            type: 'NotFound',
                            title: 'Results Not Found',
                            status: 404,
                            detail: 'Results have expired or were not saved',
                        },
                    });
                }

                const report = generateBulkReport(job, results);

                return reply.code(200).send({
                    success: true,
                    data: report,
                });
            } catch (error) {
                throw error;
            }
        }
    );

    /**
     * GET /api/v1/contracts/bulk/jobs
     * List all bulk jobs for organization
     */
    app.get(
        '/api/v1/contracts/bulk/jobs',
        { preHandler: [authenticateUser, requireOrg] },
        async (req, reply) => {
            const orgId = req.orgId as string;
            const { limit } = req.query as { limit?: string };

            try {
                const jobs = await getOrgBulkJobs(orgId, parseInt(limit || '20', 10));

                return reply.code(200).send({
                    success: true,
                    data: jobs,
                    count: jobs.length,
                });
            } catch (error) {
                throw error;
            }
        }
    );
}
