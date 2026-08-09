import type { Transaction } from '@/src/domain/types';
import { dayISO } from './dates';

/** Single-pass month summary — income, expenses, net, and budget left. */
export function monthSummary(
  transactions: Transaction[],
  monthlyBudget = 0,
): { income: number; expenses: number; net: number; budgetLeft: number } {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  let income = 0;
  let expenses = 0;
  for (const t of transactions) {
    const d = new Date(t.date);
    if (d.getMonth() !== month || d.getFullYear() !== year) continue;
    if (t.kind === 'income') income += t.amount;
    else expenses += t.amount;
  }
  return {
    income,
    expenses,
    net: income - expenses,
    budgetLeft: Math.round(monthlyBudget - expenses),
  };
}

export function monthExpenses(transactions: Transaction[]): number {
  return monthSummary(transactions).expenses;
}

export function monthIncome(transactions: Transaction[]): number {
  return monthSummary(transactions).income;
}

export function netBalance(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => sum + (t.kind === 'income' ? t.amount : -t.amount), 0);
}

export function monthNet(transactions: Transaction[]): number {
  return monthSummary(transactions).net;
}

export function budgetLeft(transactions: Transaction[], monthlyBudget: number): number {
  return monthSummary(transactions, monthlyBudget).budgetLeft;
}

const FINANCE_CATEGORY_COLORS: Record<string, string> = {
  Food: '#B8860B',
  Transport: '#2C5F8A',
  Home: '#8A4A2F',
  Health: '#2D7A4F',
  Entertainment: '#6B4C8A',
  Shopping: '#8A3A3A',
  Income: '#3A5A8A',
};

export function categoryColor(category: string): string {
  return FINANCE_CATEGORY_COLORS[category] ?? '#4A4A4A';
}

export function expenseByCategory(
  transactions: Transaction[],
): { category: string; amount: number; color: string }[] {
  const map = new Map<string, number>();
  transactions
    .filter((t) => t.kind === 'expense')
    .forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + t.amount));
  return Array.from(map.entries())
    .map(([category, amount]) => ({ category, amount, color: categoryColor(category) }))
    .sort((a, b) => b.amount - a.amount);
}

/** Expenses for the *previous* calendar month. */
export function prevMonthExpenses(transactions: Transaction[]): number {
  const now = new Date();
  const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  return transactions
    .filter((t) => t.kind === 'expense')
    .filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

export interface MonthComparison {
  current: number;
  previous: number;
  delta: number;
  percent: number | null;
}

export function monthComparison(transactions: Transaction[]): MonthComparison {
  const current = monthExpenses(transactions);
  const previous = prevMonthExpenses(transactions);
  const delta = current - previous;
  const percent = previous > 0 ? Math.round((delta / previous) * 100) : null;
  return { current, previous, delta, percent };
}

export function monthElapsedFraction(now = new Date()): number {
  const day = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Math.min(1, day / daysInMonth);
}

export interface RecurringCharge {
  merchant: string;
  category: string;
  amount: number;
  occurrences: number;
}

export function recurringCharges(transactions: Transaction[]): RecurringCharge[] {
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    if (t.kind !== 'expense') continue;
    const key = t.merchant.trim().toLowerCase();
    if (!key) continue;
    const list = groups.get(key) ?? [];
    list.push(t);
    groups.set(key, list);
  }

  const out: RecurringCharge[] = [];
  for (const list of Array.from(groups.values())) {
    const months = new Set(
      list.map((t: Transaction) => {
        const d = new Date(t.date);
        return `${d.getFullYear()}-${d.getMonth()}`;
      }),
    );
    if (months.size < 2) continue;

    const amounts = list.map((t: Transaction) => t.amount).sort((a: number, b: number) => a - b);
    const median = amounts[Math.floor(amounts.length / 2)];
    const catCounts = new Map<string, number>();
    for (const t of list) catCounts.set(t.category, (catCounts.get(t.category) ?? 0) + 1);
    const category = Array.from(catCounts.entries()).sort((a, b) => b[1] - a[1])[0][0];

    out.push({
      merchant: list[0].merchant.trim(),
      category,
      amount: Math.round(median * 100) / 100,
      occurrences: months.size,
    });
  }
  return out.sort((a, b) => b.amount - a.amount);
}

export function recurringMonthlyTotal(transactions: Transaction[]): number {
  return recurringCharges(transactions).reduce((s, r) => s + r.amount, 0);
}

/** Expenses (sum) within the last `days` days. */
export function expensesInWindow(transactions: Transaction[], days: number): number {
  const cutoff = +new Date(dayISO(-(days - 1)));
  return transactions
    .filter((t) => t.kind === 'expense' && +new Date(t.date) >= cutoff)
    .reduce((s, t) => s + t.amount, 0);
}

export function expensesInPrevWindow(transactions: Transaction[], days: number): number {
  const start = +new Date(dayISO(-(days * 2 - 1)));
  const end = +new Date(dayISO(-(days - 1)));
  return transactions
    .filter((t) => {
      if (t.kind !== 'expense') return false;
      const time = +new Date(t.date);
      return time >= start && time < end;
    })
    .reduce((s, t) => s + t.amount, 0);
}
