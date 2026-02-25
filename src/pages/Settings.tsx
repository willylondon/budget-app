import { useBudgetStore } from '../store/useBudgetStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function Settings() {
    const { transactions, debts, vacations, currency, setCurrency } = useBudgetStore();

    const exportData = () => {
        const data = { transactions, debts, vacations, exportedAt: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "budget-export.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportCSV = () => {
        const rows = [["Date", "Type", "Name", "Amount", "Category", "Notes"]];
        transactions.forEach(t => rows.push([t.date, t.type, t.name, t.amount.toString(), t.category || "Income", t.notes || ""]));
        const csv = rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "transactions.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-4">
            <Card>
                <div className="text-sm font-semibold mb-3 text-textSecondary">Currency</div>
                <div className="flex gap-3">
                    {(["JMD", "USD"] as const).map(c => (
                        <Button
                            key={c}
                            variant={currency === c ? 'primary' : 'outline'}
                            className="flex-1 py-3"
                            onClick={() => setCurrency(c)}
                        >
                            {c === "JMD" ? "🇯🇲 JMD (J$)" : "🇺🇸 USD ($)"}
                        </Button>
                    ))}
                </div>
            </Card>

            <Card>
                <div className="text-sm font-semibold mb-3 text-textSecondary">Export Data</div>
                <div className="space-y-3">
                    <Button variant="outline" fullWidth onClick={exportData} className="justify-center border-border/50 bg-surface/50">
                        ↓ Export Database (JSON)
                    </Button>
                    <Button variant="outline" fullWidth onClick={exportCSV} className="justify-center border-border/50 bg-surface/50">
                        ↓ Export Transactions (CSV)
                    </Button>
                </div>
            </Card>

            <Card>
                <div className="text-sm font-semibold mb-1 text-textSecondary">Database Summary</div>
                <div className="text-xs space-y-2 text-textMuted bg-border/20 p-3 rounded-lg border border-border/30">
                    <div className="flex justify-between"><span>Transactions:</span> <span className="text-textPrimary font-mono">{transactions.length}</span></div>
                    <div className="flex justify-between"><span>Debts tracked:</span> <span className="text-textPrimary font-mono">{debts.length}</span></div>
                    <div className="flex justify-between"><span>Vacation goals:</span> <span className="text-textPrimary font-mono">{vacations.length}</span></div>
                    <div className="pt-2 mt-2 border-t border-border/50 text-[10px] text-textMuted">
                        Data is stored securely and privately in your browser's local storage via Zustand Persist. It never leaves this device unless you export it.
                    </div>
                </div>
            </Card>
        </div>
    );
}
