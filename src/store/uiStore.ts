import { create } from 'zustand';

interface UIState {
  currency: string;
  setCurrency: (currency: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  currency: localStorage.getItem('currency') || 'INR',
  setCurrency: (currency) => {
    localStorage.setItem('currency', currency);
    set({ currency });
  },
}));

export const formatCurrency = (amount: number, currency: string = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};
