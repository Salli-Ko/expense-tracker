export const formatDateForInput = (date: Date | null): string => {
  return date ? date.toISOString().split('T')[0] : '';
};