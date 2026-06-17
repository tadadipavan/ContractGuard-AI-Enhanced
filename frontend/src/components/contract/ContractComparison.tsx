/**
 * ContractComparison.tsx
 *
 * NEW FEATURE: Contract Comparison UI Component
 * Displays side-by-side comparison of two contracts
 * Highlights differences and shows similarity metrics
 */

import { useEffect, useState } from 'react';
import type { ComparisonReport, ContractDiff } from '@/types/comparison.types';
import { Loader, AlertCircle, CheckCircle, MinusCircle } from 'lucide-react';
import clsx from 'clsx';
import './ContractComparison.css';

interface ContractComparisonProps {
    contractId1: string;
    contractId2: string;
    onClose?: () => void;
}

export function ContractComparison({
    contractId1,
    contractId2,
    onClose,
}: ContractComparisonProps) {
    const [comparison, setComparison] = useState<ComparisonReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDiff, setSelectedDiff] = useState<number | null>(null);

    useEffect(() => {
        const loadComparison = async () => {
            try {
                setLoading(true);
                const response = await fetch(
                    `/api/v1/contracts/compare/${contractId1}/${contractId2}`
                );

                if (!response.ok) {
                    throw new Error('Failed to load comparison');
                }

                const data = await response.json();
                setComparison(data.data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        loadComparison();
    }, [contractId1, contractId2]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2">Loading comparison...</span>
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

    if (!comparison) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="border-b pb-4">
                <h2 className="text-2xl font-bold">Contract Comparison</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Detailed side-by-side comparison of two contracts
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                    label="Common Clauses"
                    value={comparison.commonClauses}
                    icon="check"
                />
                <SummaryCard
                    label="Unique to Contract 1"
                    value={comparison.uniqueToClauses1}
                    icon="minus"
                />
                <SummaryCard
                    label="Unique to Contract 2"
                    value={comparison.uniqueToClauses2}
                    icon="plus"
                />
                <SummaryCard
                    label="Risk Difference"
                    value={Math.abs(comparison.riskDifference)}
                    icon="alert"
                />
            </div>

            {/* Recommendations */}
            {comparison.summary.recommendations.length > 0 && (
                <div className="rounded-lg bg-blue-50 p-4">
                    <h3 className="font-semibold text-blue-900">Recommendations</h3>
                    <ul className="mt-2 space-y-1">
                        {comparison.summary.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-sm text-blue-800">
                                {rec}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Detailed Differences */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Clause Differences</h3>
                {comparison.diffs.length === 0 ? (
                    <p className="text-gray-600">
                        No significant differences found between contracts.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {comparison.diffs.map((diff, idx) => (
                            <DiffItem
                                key={idx}
                                diff={diff}
                                isSelected={selectedDiff === idx}
                                onClick={() =>
                                    setSelectedDiff(selectedDiff === idx ? null : idx)
                                }
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Selected Diff Detail */}
            {selectedDiff !== null && (
                <DiffDetail diff={comparison.diffs[selectedDiff]} />
            )}

            {/* Close Button */}
            {onClose && (
                <button
                    onClick={onClose}
                    className="w-full rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
                >
                    Close
                </button>
            )}
        </div>
    );
}

function SummaryCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: number;
    icon: 'check' | 'minus' | 'plus' | 'alert';
}) {
    const getIcon = () => {
        switch (icon) {
            case 'check':
                return <CheckCircle className="h-6 w-6 text-green-600" />;
            case 'minus':
                return <MinusCircle className="h-6 w-6 text-red-600" />;
            case 'plus':
                return <CheckCircle className="h-6 w-6 text-blue-600" />;
            case 'alert':
                return <AlertCircle className="h-6 w-6 text-yellow-600" />;
        }
    };

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600">{label}</p>
                    <p className="mt-1 text-2xl font-bold">{value}</p>
                </div>
                {getIcon()}
            </div>
        </div>
    );
}

interface DiffItemProps {
    diff: ContractDiff;
    isSelected: boolean;
    onClick: () => void;
}

function DiffItem({ diff, isSelected, onClick }: DiffItemProps) {
    const categoryColor = {
        added: 'bg-green-50 border-green-200',
        removed: 'bg-red-50 border-red-200',
        modified: 'bg-yellow-50 border-yellow-200',
        similar: 'bg-blue-50 border-blue-200',
    }[diff.category];

    const categoryLabel = {
        added: '✓ Added in Contract 2',
        removed: '✗ Removed from Contract 1',
        modified: '◎ Modified',
        similar: '≈ Similar',
    }[diff.category];

    return (
        <div
            onClick={onClick}
            className={clsx(
                'cursor-pointer rounded-lg border p-4 transition-all',
                categoryColor,
                isSelected && 'ring-2 ring-primary'
            )}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="font-semibold">{diff.clauseType}</p>
                    <p className="mt-1 text-xs font-medium">{categoryLabel}</p>
                    <p className="mt-2 text-sm text-gray-700">
                        {diff.contract1?.text || diff.contract2?.text}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-600">
                        Similarity: {Math.round(diff.similarity * 100)}%
                    </p>
                </div>
            </div>
        </div>
    );
}

interface DiffDetailProps {
    diff: ContractDiff;
}

function DiffDetail({ diff }: DiffDetailProps) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h4 className="font-semibold">Detail View</h4>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {diff.contract1 && (
                    <div>
                        <p className="text-sm font-medium text-gray-700">
                            Contract 1
                        </p>
                        <p className="mt-2 rounded bg-gray-50 p-2 text-sm">
                            {diff.contract1.text}
                        </p>
                        <span
                            className={clsx(
                                'mt-2 inline-block rounded px-2 py-1 text-xs font-medium',
                                diff.contract1.riskLevel === 'high'
                                    ? 'bg-red-100 text-red-800'
                                    : diff.contract1.riskLevel === 'medium'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-green-100 text-green-800'
                            )}
                        >
                            Risk: {diff.contract1.riskLevel}
                        </span>
                    </div>
                )}
                {diff.contract2 && (
                    <div>
                        <p className="text-sm font-medium text-gray-700">
                            Contract 2
                        </p>
                        <p className="mt-2 rounded bg-gray-50 p-2 text-sm">
                            {diff.contract2.text}
                        </p>
                        <span
                            className={clsx(
                                'mt-2 inline-block rounded px-2 py-1 text-xs font-medium',
                                diff.contract2.riskLevel === 'high'
                                    ? 'bg-red-100 text-red-800'
                                    : diff.contract2.riskLevel === 'medium'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-green-100 text-green-800'
                            )}
                        >
                            Risk: {diff.contract2.riskLevel}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
