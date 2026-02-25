export type TransactionType = 'income' | 'expense';

export interface Transaction {
    id: number;
    type: TransactionType;
    name: string;
    amount: number;
    category: string;
    date: string;
    notes?: string;
}

export type DebtType = 'loan' | 'credit card';

export interface Debt {
    id: number;
    type: DebtType;
    name: string;
    balance: number;
    rate: number;
    minPayment: number;
    dueDate?: string;
    paid: number;
    totalInterestPaid: number;
}

export interface Vacation {
    id: number;
    name: string;
    goal: number;
    saved: number;
    targetDate?: string;
    notes?: string;
}

export type Currency = 'JMD' | 'USD';
