/**
 * analytics.route.ts
 *
 * API Routes for Analytics Feature (NEW)
 * 
 * Endpoints:
 * - GET /api/v1/analytics/summary - Dashboard summary
 * - GET /api/v1/analytics/trends - Trend analysis
 * - GET /api/v1/analytics/risks/distribution - Risk distribution
 * - GET /api/v1/analytics/clauses - Clause analysis
 */

import type { FastifyInstance } from 'fastify';
import {
    getDashboardSummary,
    getTrendAnalysis,
    getRiskDistribution,
    getClauseAnalysis,
    generateAnalyticsReport,
} from '@/services/analytics.service.js';
import { authenticateUser } from '@/middleware/authenticate.js';
import { requireOrg } from '@/middleware/requireOrg.js';
import { z } from 'zod';

// ─── Query Schemas ────────────────────────────────────────────

const TrendQuerySchema = z.object({
    period: z.string().regex(/^\d+d$/).optional().default('30d'),
});

// ─── Routes ───────────────────────────────────────────────────

export async function setupAnalyticsRoutes(app: FastifyInstance) {
    /**
     * GET /api/v1/analytics/summary
     * Get dashboard summary metrics
     */
    app.get(
        '/api/v1/analytics/summary',
        { preHandler: [authenticateUser, requireOrg] },
        async (req, reply) => {
            const orgId = req.orgId as string;

            try {
                const summary = await getDashboardSummary(orgId);
                
                return reply.code(200).send({
                    success: true,
                    data: summary,
                });
            } catch (error) {
                throw error;
            }
        }
    );

    /**
     * GET /api/v1/analytics/trends
     * Get trend analysis over period
     */
    app.get<{ Querystring: unknown }>(
        '/api/v1/analytics/trends',
        { preHandler: [authenticateUser, requireOrg] },
        async (req, reply) => {
            const orgId = req.orgId as string;
            const query = TrendQuerySchema.parse(req.query);
            
            // Parse period (e.g., "30d" -> 30)
            const days = parseInt(query.period.match(/\d+/)?.[0] || '30', 10);

            try {
                const trends = await getTrendAnalysis(orgId, days);
                
                return reply.code(200).send({
                    success: true,
                    data: trends,
                    period: `${days} days`,
                });
            } catch (error) {
                throw error;
            }
        }
    );

    /**
     * GET /api/v1/analytics/risks/distribution
     * Get risk level distribution
     */
    app.get(
        '/api/v1/analytics/risks/distribution',
        { preHandler: [authenticateUser, requireOrg] },
        async (req, reply) => {
            const orgId = req.orgId as string;

            try {
                const distribution = await getRiskDistribution(orgId);
                
                return reply.code(200).send({
                    success: true,
                    data: distribution,
                });
            } catch (error) {
                throw error;
            }
        }
    );

    /**
     * GET /api/v1/analytics/clauses
     * Get clause frequency and analysis
     */
    app.get(
        '/api/v1/analytics/clauses',
        { preHandler: [authenticateUser, requireOrg] },
        async (req, reply) => {
            const orgId = req.orgId as string;

            try {
                const analysis = await getClauseAnalysis(orgId);
                
                return reply.code(200).send({
                    success: true,
                    data: analysis,
                    count: analysis.length,
                });
            } catch (error) {
                throw error;
            }
        }
    );

    /**
     * GET /api/v1/analytics/report
     * Generate comprehensive report for date range
     */
    app.get<{ Querystring: unknown }>(
        '/api/v1/analytics/report',
        { preHandler: [authenticateUser, requireOrg] },
        async (req, reply) => {
            const orgId = req.orgId as string;
            const { startDate, endDate } = req.query as Record<string, string>;

            if (!startDate || !endDate) {
                return reply.code(400).send({
                    error: {
                        type: 'ValidationError',
                        title: 'Missing Parameters',
                        status: 400,
                        detail: 'startDate and endDate are required (ISO format)',
                    },
                });
            }

            try {
                const report = await generateAnalyticsReport(
                    orgId,
                    new Date(startDate),
                    new Date(endDate)
                );
                
                return reply.code(200).send({
                    success: true,
                    data: report,
                });
            } catch (error) {
                throw error;
            }
        }
    );
}
