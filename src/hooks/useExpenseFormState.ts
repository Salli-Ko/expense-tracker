import { useState } from 'react';

export type TExpenseFormState = {
  category: string;
  amount: string;
  date: Date | null;
  description: string;
  parsedMerchant: string;
  originalCategory: string;
};

const initialState: TExpenseFormState = {
  category: '',
  amount: '',
  date: null,
  description: '',
  parsedMerchant: '',
  originalCategory: '',
};

export const useExpenseFormState = () => {
  const [form, setForm] = useState<TExpenseFormState>(initialState);

  const updateForm = (updates: Partial<TExpenseFormState>) =>
    setForm((prev) => ({ ...prev, ...updates }));

  const resetForm = () => setForm(initialState);

  return {
    form,
    setForm: updateForm,
    resetForm,
  };
};
