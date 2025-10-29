interface ParsedTransaction {
  category: string;
  amount: number;
  date: Date;
  merchant?: string;
}

class TransactionParserService {
  private readonly CATEGORIES: Record<string, string[]> = {
    Groceries: ['keells', 'cargills', 'arpico', 'laugfs', 'food city', 'spar'],
    Fuel: ['ceypetco', 'shell', 'ioc', 'laughs', 'lanka ioc'],
    Dining: ['kfc', 'pizza', 'mcdonalds', 'burger king', 'subway', 'restaurant', 'cafe', 'coffee'],
    Transport: ['uber', 'pickme', 'kangaroo', 'taxi'],
    Utilities: ['ceb', 'leco', 'water board', 'dialog', 'mobitel', 'hutch', 'airtel', 'slt'],
    Healthcare: ['pharmacy', 'hospital', 'medical', 'clinic', 'pharmacy'],
    Shopping: ['fashion bug', 'odel', 'nolimit', 'cotton collection'],
    Entertainment: ['cinema', 'scope', 'savoy', 'liberty'],
    Food: ['bakers'],
  };

  parse(smsText: string): ParsedTransaction {
    const amount = this.extractAmount(smsText);
    const merchant = this.extractMerchant(smsText);
    const date = this.extractDate(smsText);
    const category = this.categorize(merchant || smsText);

    return {
      category,
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
    // Match patterns like: 25/10/25 or 25-10-2025 or 25/10/2025
    const datePatterns = [
      /(\d{2}\/\d{2}\/\d{2,4})/,
      /(\d{2}-\d{2}-\d{2,4})/,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        const dateStr = match[1];
        const parts = dateStr.split(/[/-]/);

        if (parts.length === 3) {
          let [day, month, year] = parts.map(p => parseInt(p));

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

    // Return current date if not found
    return new Date();
  }

  private categorize(text: string): string {
    const lowerText = text.toLowerCase();

    for (const [category, keywords] of Object.entries(this.CATEGORIES)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category;
      }
    }

    return 'Other';
  }
}

// Export singleton instance
export const transactionParser = new TransactionParserService();

// Usage example:
// import { transactionParser } from './services/TransactionParser';
//
// const result = transactionParser.parse(smsText);
// console.log(result);
// // { category: 'Groceries', amount: 1457, date: Date(...), merchant: 'KEELLS PILIYANDALA' }