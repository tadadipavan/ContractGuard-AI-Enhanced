/**
 * AnalyticsDashboard.tsx
 *
 * NEW FEATURE: Analytics Dashboard Component
 * Displays comprehensive analytics and insights about contracts
 * Shows trends, risk distribution, and clause analysis
 */

import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader, AlertCircle, TrendingUp } from 'lucide-react';
import type { DashboardSummary, RiskDistribution, TrendDataPoint, ClauseAnalysis } from '@/types/analytics.types';

interface AnalyticsDashboardProps {
    period?: '7d' | '30d' | '90d';
}

export function AnalyticsDashboard({ period = '30d' }: AnalyticsDashboardProps) {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [distribution, setDistribution] = useState<RiskDistribution | null>(null);
    const [trends, setTrends] = useState<TrendDataPoint[]>([]);
    const [clauses, setClauses] = useState<ClauseAnalysis[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadAnalytics = async () => {
            try {
                setLoading(true);

                const [summaryRes, distRes, trendsRes, clausesRes] = await Promise.all([
                    fetch('/api/v1/analytics/summary'),
                    fetch('/api/v1/analytics/risks/distribution'),
                    fetch(`/api/v1/analytics/trends?period=${period}`),
                    fetch('/api/v1/analytics/clauses'),
                ]);

                if (
                    !summaryRes.ok ||
                    !distRes.ok ||
                    !trendsRes.ok ||
                    !clausesRes.ok
                ) {
                    throw new Error('Failed to load analytics');
                }

                const summaryData = await summaryRes.json();
                const distData = await distRes.json();
                const trendsData = await trendsRes.json();
                const clausesData = await clausesRes.json();

                setSummary(summaryData.data);
                setDistribution(distData.data);
                setTrends(trendsData.data);
                setClauses(clausesData.data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        loadAnalytics();
    }, [period]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2">Loading analytics...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="ml-2 text-red-800">{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Contract Analytics</h1>
                <p className="mt-1 text-gray-600">
                    Comprehensive insights and trends for your contract portfolio
                </p>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        label="Total Contracts"
                        value={summary.totalContracts}
                        trend="+12%"
                    />
                    <MetricCard
                        label="High Risk"
                        value={summary.highRiskContracts}
                        trend="-5%"
                        variant="danger"
                    />
                    <MetricCard
                        label="Avg Risk Score"
                        value={summary.averageRiskScore}
                        trend="0%"
                        variant="warning"
                    />
                    <MetricCard
                        label="Analyzed Today"
                        value={summary.contractsAnalyzedToday}
                        trend="+3"
                        variant="info"
                    />
                </div>
            )}

            {/* Main Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Risk Distribution */}
                {distribution && (
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                        <h2 className="text-lg font-semibold">Risk Distribution</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'High Risk', value: distribution.high },
                                        { name: 'Medium Risk', value: distribution.medium },
                                        { name: 'Low Risk', value: distribution.low },
                                        { name: 'No Risk', value: distribution.none },
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value }) => `${name}: ${value}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    <Cell fill="#ef4444" />
                                    <Cell fill="#f59e0b" />
                                    <Cell fill="#10b981" />
                                    <Cell fill="#3b82f6" />
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Trends */}
                {trends.length > 0 && (
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                        <h2 className="text-lg font-semibold">Contract Trends</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={trends}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="contractsAdded"
                                    stroke="#3b82f6"
                                    name="Contracts Added"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="avgRiskScore"
                                    stroke="#ef4444"
                                    name="Avg Risk Score"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Clause Analysis */}
            {clauses.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <h2 className="text-lg font-semibold">Most Common Clauses</h2>
                    <div className="mt-4 space-y-4">
                        {clauses.slice(0, 5).map((clause, idx) => (
                            <div
                                key={idx}
                                className="border-b pb-4 last:border-b-0"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{clause.clauseType}</p>
                                        <p className="text-sm text-gray-600">
                                            Appears {clause.frequency} times
                                        </p>
                                    </div>
                                    <span
                                        className={`rounded px-2 py-1 text-xs font-medium ${
                                            clause.averageRiskLevel === 'high'
                                                ? 'bg-red-100 text-red-800'
                                                : clause.averageRiskLevel === 'medium'
                                                  ? 'bg-yellow-100 text-yellow-800'
                                                  : 'bg-green-100 text-green-800'
                                        }`}
                                    >
                                        {clause.averageRiskLevel}
                                    </span>
                                </div>
                                {clause.topKeywords.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {clause.topKeywords.slice(0, 3).map((kw, i) => (
                                            <span
                                                key={i}
                                                className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700"
                                            >
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

interface MetricCardProps {
    label: string;
    value: number;
    trend: string;
    variant?: 'default' | 'danger' | 'warning' | 'info';
}

function MetricCard({
    label,
    value,
    trend,
    variant = 'default',
}: MetricCardProps) {
    const variants = {
        default: 'bg-blue-50',
        danger: 'bg-red-50',
        warning: 'bg-yellow-50',
        info: 'bg-purple-50',
    };

    return (
        <div className={`rounded-lg border border-gray-200 ${variants[variant]} p-4`}>
            <p className="text-sm text-gray-600">{label}</p>
            <div className="mt-2 flex items-end justify-between">
                <p className="text-2xl font-bold">{value}</p>
                <span className="flex items-center text-xs font-medium text-green-600">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {trend}
                </span>
            </div>
        </div>
    );
}
