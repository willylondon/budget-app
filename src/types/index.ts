export type TransactionType = 'income' | 'expense';

export interface Transaction {
    id: string | number;
    type: TransactionType;
    name: string;
    amount: number;
    category: string;
    date: string;
    notes?: string;
}

export type DebtType = 'loan' | 'credit card';

export interface Debt {
    id: string | number;
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
    id: string | number;
    name: string;
    goal: number;
    saved: number;
    targetDate?: string;
    notes?: string;
}

export type SubFrequency = 'monthly' | 'yearly' | 'weekly';

export interface Subscription {
    id: string | number;
    name: string;
    amount: number;
    category: string;
    frequency: SubFrequency;
    nextDate: string;
    isActive: boolean;
}

export type Currency = 'JMD' | 'USD';
