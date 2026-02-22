/**
 * Parse and validate CSV files for import
 */

export interface CSVRow {
  [key: string]: string;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ParseResult {
  headers: string[];
  data: CSVRow[];
  errors: ValidationError[];
  valid: CSVRow[];
  invalid: CSVRow[];
}

/**
 * Parse CSV string to array of objects
 */
export function parseCSV(csvContent: string): { headers: string[]; rows: CSVRow[] } {
  const lines = csvContent.trim().split('\n');
  
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // Parse headers
  const headers = lines[0].split(',').map(h => h.trim());

  // Parse rows
  const rows: CSVRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    
    if (values.length === headers.length) {
      const row: CSVRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      rows.push(row);
    }
  }

  return { headers, rows };
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format (Ghana: 10 digits)
 */
export function isValidPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\s|-/g, '');
  return /^0\d{9}$/.test(cleanPhone);
}

/**
 * Validate date format (YYYY-MM-DD or MM/DD/YYYY)
 */
export function isValidDate(dateString: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validate required field
 */
export function isRequired(value: string): boolean {
  return value !== undefined && value !== null && value.trim() !== '';
}

/**
 * Download CSV template
 */
export function downloadTemplate(headers: string[], filename: string, exampleRow?: string[]) {
  let csvContent = headers.join(',') + '\n';
  
  if (exampleRow) {
    csvContent += exampleRow.join(',') + '\n';
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}