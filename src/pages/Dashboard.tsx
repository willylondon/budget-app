import { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useBudgetStore } from '../store/useBudgetStore';
import { formatCurrency, CATEGORIES, CAT_COLORS } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';

export function Dashboard() {
    const { transactions, debts, vacations, currency } = useBudgetStore();

    const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const balance = income - expenses;
    const totalDebt = debts.reduce((s, d) => s + d.balance, 0);

    const catData = useMemo(() => {
        return CATEGORIES.map(c => ({
            name: c,
            value: transactions.filter(t => t.type === "expense" && t.category === c).reduce((s, t) => s + t.amount, 0)
        })).filter(d => d.value > 0);
    }, [transactions]);

    const last6 = useMemo(() => {
        const now = new Date();
        return Array.from({ length: 6 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
            const label = d.toLocaleString("default", { month: "short" });
            const mo = d.getMonth(), yr = d.getFullYear();
            const inc = transactions.filter(t => {
                const td = new Date(t.date);
                return td.getMonth() === mo && td.getFullYear() === yr && t.type === "income";
            }).reduce((s, t) => s + t.amount, 0);
            const exp = transactions.filter(t => {
                const td = new Date(t.date);
                return td.getMonth() === mo && td.getFullYear() === yr && t.type === "expense";
            }).reduce((s, t) => s + t.amount, 0);
            return { label, income: inc, expenses: exp };
        });
    }, [transactions]);

    const cards = [
        { label: "Balance", value: formatCurrency(balance, currency), color: balance >= 0 ? "text-success" : "text-danger", icon: "◈" },
        { label: "Income", value: formatCurrency(income, currency), color: "text-blue-500", icon: "↑" },
        { label: "Expenses", value: formatCurrency(expenses, currency), color: "text-primary", icon: "↓" },
        { label: "Total Debt", value: formatCurrency(totalDebt, currency), color: "text-purple-500", icon: "⊖" },
    ];

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
                {cards.map(c => (
                    <Card key={c.label}>
                        <div className="text-xs mb-1 text-textMuted">{c.icon} {c.label}</div>
                        <div className={`text-xl font-bold font-mono ${c.color}`}>{c.value}</div>
                    </Card>
                ))}
            </div>

            {/* Spending Breakdown Pie Chart */}
            {catData.length > 0 && (
                <Card>
                    <div className="text-sm font-semibold mb-3 text-textSecondary">Spending by Category</div>
                    <div className="w-full h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} strokeWidth={0}>
                                    {catData.map(entry => <Cell key={entry.name} fill={CAT_COLORS[entry.name]} />)}
                                </Pie>
                                <Tooltip
                                    formatter={(v: any) => formatCurrency(Number(v), currency)}
                                    contentStyle={{ background: "#1e293b", border: "none", borderRadius: "8px", color: "#e2e8f0" }}
                                />
                                <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            )}

            {/* 6-Month Overview Bar Chart */}
            <Card>
                <div className="text-sm font-semibold mb-3 text-textSecondary">6-Month Overview</div>
                <div className="w-full h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={last6} barSize={10}>
                            <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                            <Tooltip
                                formatter={(v: any) => formatCurrency(Number(v), currency)}
                                contentStyle={{ background: "#1e293b", border: "none", borderRadius: "8px", color: "#e2e8f0" }}
                            />
                            <Bar dataKey="income" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expenses" fill="#f97316" radius={[4, 4, 0, 0]} />
                            <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Quick Vacation Summary */}
            {vacations.length > 0 && (
                <Card>
                    <div className="text-sm font-semibold mb-3 text-textSecondary">✦ Vacation Funds</div>
                    <div className="space-y-4">
                        {vacations.map(v => (
                            <div key={v.id}>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-textPrimary font-medium">{v.name}</span>
                                    <span className="text-primary font-mono">{formatCurrency(v.saved, currency)} / {formatCurrency(v.goal, currency)}</span>
                                </div>
                                <ProgressBar value={v.saved} max={v.goal} color="#f97316" />
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
