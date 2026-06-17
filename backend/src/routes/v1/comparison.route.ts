/**
 * comparison.route.ts
 *
 * API Routes for Contract Comparison Feature (NEW)
 * 
 * Endpoints:
 * - POST /api/v1/contracts/compare - Compare two contracts
 * - GET /api/v1/contracts/compare/:id1/:id2 - Get comparison results
 * - GET /api/v1/contracts/:id/comparisons - Get comparison history
 */

import type { FastifyInstance } from 'fastify';
import { compareContracts, getContractComparisonHistory } from '@/services/contractComparison.service.js';
import { authenticateUser } from '@/middleware/authenticate.js';
import { requireOrg } from '@/middleware/requireOrg.js';
import { z } from 'zod';

// ─── Request Schemas ──────────────────────────────────────────

const CompareRequestSchema = z.object({
    contractId1: z.string().uuid('Invalid contract ID'),
    contractId2: z.string().uuid('Invalid contract ID'),
});

// ─── Routes ───────────────────────────────────────────────────

export async function setupComparisonRoutes(app: FastifyInstance) {
    /**
     * POST /api/v1/contracts/compare
     * Compare two contracts
     */
    app.post<{ Body: unknown }>(
        '/api/v1/contracts/compare',
        { preHandler: [authenticateUser, requireOrg] },
        async (req, reply) => {
            const user = req.user as { sub: string; aud: string };
            const orgId = req.orgId as string;
            
            const { contractId1, contractId2 } = CompareRequestSchema.parse(req.body);

            try {
                const comparison = await compareContracts(contractId1, contractId2, orgId);
                
                return reply.code(200).send({
                    success: true,
                    data: comparison,
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Comparison failed';
                
                if (message.includes('not found')) {
                    return reply.code(404).send({
                        error: {
                            type: 'NotFound',
                            title: 'Contract Not Found',
                            status: 404,
                            detail: 'One or both contracts do not exist',
                        },
                    });
                }

                throw error;
            }
        }
    );

    /**
     * GET /api/v1/contracts/compare/:id1/:id2
     * Get cached comparison results
     */
    app.get<{ Params: { id1: string; id2: string } }>(
        '/api/v1/contracts/compare/:id1/:id2',
        { preHandler: [authenticateUser, requireOrg] },
        async (req, reply) => {
            const orgId = req.orgId as string;
            const { id1, id2 } = req.params;

            try {
                const comparison = await compareContracts(id1, id2, orgId);
                
                return reply.code(200).send({
                    success: true,
                    data: comparison,
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Comparison failed';
                
                if (message.includes('not found')) {
                    return reply.code(404).send({
                        error: {
                            type: 'NotFound',
                            title: 'Contract Not Found',
                            status: 404,
                            detail: 'One or both contracts do not exist',
                        },
                    });
                }

                throw error;
            }
        }
    );

    /**
     * GET /api/v1/contracts/:id/comparisons
     * Get comparison history for a contract
     */
    app.get<{ Params: { id: string } }>(
        '/api/v1/contracts/:id/comparisons',
        { preHandler: [authenticateUser, requireOrg] },
        async (req, reply) => {
            const orgId = req.orgId as string;
            const { id } = req.params;

            try {
                const history = await getContractComparisonHistory(id, orgId, 10);
                
                return reply.code(200).send({
                    success: true,
                    data: history,
                    count: history.length,
                });
            } catch (error) {
                throw error;
            }
        }
    );
}
