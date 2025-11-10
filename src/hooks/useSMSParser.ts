import { useState } from 'react';
import { transactionParser } from '@/transaction-parser/TransactionParser';

export const useSmsParser = () => {
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const parseSms = async (smsMessage: string) => {
    if (!smsMessage.trim()) {
      setError('Please paste your bank SMS first');
      return;
    }

    try {
      const parsed = await transactionParser.parse(smsMessage);
      if (!parsed || parsed.amount === 0) {
        setError('Could not extract amount or category from this message');
        return;
      }

      setParsedData(parsed);
      setError(null);
      return parsed;
    } catch (err) {
      console.error(err);
      setError('Failed to parse SMS message');
    }
  };

  return { parsedData, error, parseSms };
};
