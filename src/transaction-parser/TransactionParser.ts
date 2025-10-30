import StorageService from '@/database/StorageService';
import { DEFAULT_CATEGORIES } from '@/constants/defaultCategories';

interface ParsedTransaction {
  categoryId: number | null; // Changed from category: string
  categoryName: string; // Keep for display purposes
  amount: number;
  date: Date;
  merchant?: string;
}

class TransactionParserService {
  async parse(smsText: string): Promise<ParsedTransaction> {
    const amount = this.extractAmount(smsText);
    const merchant = this.extractMerchant(smsText);
    const date = this.extractDate(smsText);
    const { categoryId, categoryName } = await this.categorize(merchant || smsText);

    return {
      categoryId,
      categoryName,
      amount,
      date,
      merchant,
    };
  }

  private extractAmount(text: string): number {
    // Match patterns like: LKR 1,457.00 or Rs. 1457.00 or Rs 1,457
    const patterns = [
      /(?:LKR|Rs\.?|රු\.?)\s*([\d,]+\.?\d*)/i,
      /([\d,]+\.?\d*)\s*(?:LKR|Rs\.?|රු\.?)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const amountStr = match[1].replace(/,/g, '');
        const amount = parseFloat(amountStr);
        if (!isNaN(amount)) return amount;
      }
    }

    return 0;
  }

  private extractMerchant(text: string): string | undefined {
    // Match patterns like: "at MERCHANT_NAME for" or "at MERCHANT_NAME on"
    const patterns = [
      /(?:at|from)\s+([A-Z][A-Z\s&.-]+?)(?:\s+for|\s+on|\s+LKR|\s+Rs)/i,
      /(?:Purchase|Transaction|Payment)\s+at\s+([A-Z][A-Z\s&.-]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  private extractDate(text: string): Date {
    try {
      // Match patterns like: 25/10/25 or 25-10-2025 or 25/10/2025
      const datePatterns = [/(\d{2}\/\d{2}\/\d{2,4})/, /(\d{2}-\d{2}-\d{2,4})/];

      for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
          const dateStr = match[1];
          const parts = dateStr.split(/[/-]/);

          if (parts.length === 3) {
            let [day, month, year] = parts.map((p) => parseInt(p));

            // Handle 2-digit year
            if (year < 100) {
              year += 2000;
            }

            const date = new Date(year, month - 1, day);

            // Extract time if exists
            const timeMatch = text.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
            if (timeMatch) {
              let hours = parseInt(timeMatch[1]);
              const minutes = parseInt(timeMatch[2]);
              const meridiem = timeMatch[3]?.toUpperCase();

              if (meridiem === 'PM' && hours < 12) hours += 12;
              if (meridiem === 'AM' && hours === 12) hours = 0;

              date.setHours(hours, minutes);
            }

            return date;
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    // Return current date if not found
    return new Date();
  }

  /**
   * Categorize text using both learned keywords and default categories
   * Priority: Learned keywords > Default keywords
   * @returns categoryId and categoryName
   */
  private async categorize(text: string): Promise<{ categoryId: number | null; categoryName: string }> {
    const lowerText = text.toLowerCase();

    // First, try to find a learned category
    try {
      const learnedCategoryId = await StorageService.searchLearnedCategory(text);
      if (learnedCategoryId) {
        // Get the category name from ID
        const category = await StorageService.getCategoryById(learnedCategoryId);
        if (category) {
          console.log(`Found learned category: ${category.name} (ID: ${learnedCategoryId})`);
          return { categoryId: learnedCategoryId, categoryName: category.name };
        }
      }
    } catch (error) {
      console.error('Error searching learned categories:', error);
      // Continue to default categories if there's an error
    }

    // Fall back to default categories - find by name
    for (const [categoryName, keywords] of Object.entries(DEFAULT_CATEGORIES)) {
      if (keywords.some((keyword) => lowerText.includes(keyword))) {
        // Find the category ID from the database
        try {
          const category = await StorageService.getCategoryByName(categoryName);
          if (category?.id) {
            console.log(`Found default category: ${categoryName} (ID: ${category.id})`);
            return { categoryId: category.id, categoryName };
          }
        } catch (error) {
          console.error(`Error finding category ${categoryName}:`, error);
        }
        // If we can't find the ID, still return the name
        return { categoryId: null, categoryName };
      }
    }

    // Try to find "Other" category
    try {
      const otherCategory = await StorageService.getCategoryByName('Other');
      if (otherCategory?.id) {
        return { categoryId: otherCategory.id, categoryName: 'Other' };
      }
    } catch (error) {
      console.error('Error finding Other category:', error);
    }

    return { categoryId: null, categoryName: 'Other' };
  }

  /**
   * Learn a new merchant-category association
   * This method is no longer needed - use StorageService.saveCategoryKeyword directly
   * @deprecated
   */
  async learnCategory(merchant: string, categoryId: number): Promise<void> {
    if (!merchant || !categoryId) return;

    try {
      await StorageService.saveCategoryKeyword(merchant.toLowerCase(), categoryId);
    } catch (error) {
      console.error('Error learning category:', error);
      throw error;
    }
  }
}

export const transactionParser = new TransactionParserService();