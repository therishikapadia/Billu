/**
 * Format amount into Indian Rupee standard format (e.g., ₹ 1,23,456.78)
 */
export function formatCurrency(amount: number, symbol: string = '₹'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${symbol} 0.00`;
  }
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  const parts = absAmount.toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Indian Numbering grouping (last 3 digits, then groups of 2)
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  return `${isNegative ? '-' : ''}${symbol} ${formattedInt}.${decimalPart}`;
}

/**
 * Format date to standard readable format (DD MMM YYYY)
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Convert number to words in Indian numbering system (Lakhs, Crores)
 */
export function numberToIndianWords(num: number): string {
  if (!num || isNaN(num) || num === 0) return 'Rupees Zero Only';

  const singleDigits = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convertTwoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 20) return singleDigits[n];
    const unit = n % 10;
    return tens[Math.floor(n / 10)] + (unit !== 0 ? ' ' + singleDigits[unit] : '');
  }

  function convertThreeDigits(n: number): string {
    let str = '';
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    if (hundred > 0) {
      str += singleDigits[hundred] + ' Hundred';
      if (rest > 0) str += ' and ';
    }
    if (rest > 0) {
      str += convertTwoDigits(rest);
    }
    return str;
  }

  const integerVal = Math.floor(Math.abs(num));
  const decimalVal = Math.round((Math.abs(num) - integerVal) * 100);

  let words = '';
  const crore = Math.floor(integerVal / 10000000);
  let remainder = integerVal % 10000000;

  const lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;

  const thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  if (crore > 0) {
    words += convertTwoDigits(crore) + ' Crore ';
  }
  if (lakh > 0) {
    words += convertTwoDigits(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    words += convertTwoDigits(thousand) + ' Thousand ';
  }
  if (remainder > 0) {
    words += convertThreeDigits(remainder) + ' ';
  }

  let result = 'Rupees ' + words.trim();
  if (decimalVal > 0) {
    result += ' and ' + convertTwoDigits(decimalVal) + ' Paise';
  }
  result += ' Only';

  return result;
}

/**
 * Native haptic feedback (disabled per user request)
 */
export async function triggerHaptic(_type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
  // Vibration on click disabled
}

/**
 * Given a date string (YYYY-MM-DD or ISO), returns the Indian Financial Year string, e.g. "FY 2026-27"
 */
export function getFinancialYear(dateString: string): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  const month = d.getMonth() + 1; // 1-12
  const fullYear = d.getFullYear();
  if (month >= 4) {
    const nextYear = (fullYear + 1).toString().slice(-2);
    return `FY ${fullYear}-${nextYear}`;
  } else {
    const prevYear = fullYear - 1;
    const currYearShort = fullYear.toString().slice(-2);
    return `FY ${prevYear}-${currYearShort}`;
  }
}

/**
 * Returns the Quarter of the Indian Financial Year (1 to 4)
 * Q1: Apr - Jun (Months 4, 5, 6)
 * Q2: Jul - Sep (Months 7, 8, 9)
 * Q3: Oct - Dec (Months 10, 11, 12)
 * Q4: Jan - Mar (Months 1, 2, 3)
 */
export function getFiscalQuarter(dateString: string): number {
  if (!dateString) return 1;
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 1;
  const month = d.getMonth() + 1;
  if (month >= 4 && month <= 6) return 1;
  if (month >= 7 && month <= 9) return 2;
  if (month >= 10 && month <= 12) return 3;
  return 4;
}

/**
 * Get human label for a fiscal quarter
 */
export function getFiscalQuarterLabel(q: number): string {
  switch (q) {
    case 1:
      return 'Q1 (Apr - Jun)';
    case 2:
      return 'Q2 (Jul - Sep)';
    case 3:
      return 'Q3 (Oct - Dec)';
    case 4:
      return 'Q4 (Jan - Mar)';
    default:
      return `Q${q}`;
  }
}
