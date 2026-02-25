import { describe, it, expect, beforeEach } from 'vitest';
import { useBudgetStore } from './useBudgetStore';

describe('useBudgetStore', () => {
    beforeEach(() => {
        // Reset state before each test
        useBudgetStore.setState({
            transactions: [],
            debts: [],
            vacations: [],
            currency: 'JMD',
        });
    });

    describe('Transactions', () => {
        it('should add a transaction', () => {
            useBudgetStore.getState().addTransaction({
                name: 'Groceries',
                amount: 50.5,
                category: 'Food',
                date: '2023-10-01',
                type: 'expense'
            });

            const { transactions } = useBudgetStore.getState();
            expect(transactions).toHaveLength(1);
            expect(transactions[0].name).toBe('Groceries');
            expect(transactions[0].amount).toBe(50.5);
        });

        it('should remove a transaction', () => {
            useBudgetStore.getState().addTransaction({
                name: 'Salary',
                amount: 1000,
                category: '',
                date: '2023-10-01',
                type: 'income'
            });
            const id = useBudgetStore.getState().transactions[0].id;

            useBudgetStore.getState().removeTransaction(id);
            expect(useBudgetStore.getState().transactions).toHaveLength(0);
        });
    });

    describe('Debts', () => {
        it('should add a debt and make a payment', () => {
            useBudgetStore.getState().addDebt({
                name: 'Car Loan',
                type: 'loan',
                balance: 5000,
                rate: 5,
                minPayment: 100
            });

            const { debts } = useBudgetStore.getState();
            expect(debts).toHaveLength(1);
            expect(debts[0].balance).toBe(5000);
            expect(debts[0].paid).toBe(0);

            const id = debts[0].id;
            useBudgetStore.getState().makeDebtPayment(id, 500);

            const updatedDebts = useBudgetStore.getState().debts;
            expect(updatedDebts[0].balance).toBe(4500);
            expect(updatedDebts[0].paid).toBe(500);
        });

        it('should not allow negative debt balance', () => {
            useBudgetStore.getState().addDebt({
                name: 'Credit Card',
                type: 'credit card',
                balance: 100,
                rate: 20,
                minPayment: 25
            });
            const id = useBudgetStore.getState().debts[0].id;

            // Overpay
            useBudgetStore.getState().makeDebtPayment(id, 200);

            const updatedDebts = useBudgetStore.getState().debts;
            expect(updatedDebts[0].balance).toBe(0); // Clamped to 0
            expect(updatedDebts[0].paid).toBe(200);
        });
    });
});
