/**
 * Generate a pet ID based on clinic's ID format
 * @param format - The format string (e.g., "MS/VC/####", "PET####", "P###")
 * @param number - The sequential number
 * @returns Formatted pet ID (e.g., "MS/VC/0001", "PET0001", "P001")
 */
export function generatePetId(format: string, number: number): string {
  // Count consecutive # symbols
  const hashCount = (format.match(/#+/)?.[0]?.length) || 4;
  
  // Pad number with zeros
  const paddedNumber = String(number).padStart(hashCount, '0');
  
  // Replace # symbols with padded number
  return format.replace(/#+/, paddedNumber);
}

/**
 * Get the next pet ID for a clinic
 * @param currentCount - Current pet count in clinic
 * @param format - The clinic's pet ID format
 * @returns Next formatted pet ID
 */
export function getNextPetId(currentCount: number, format: string): string {
  return generatePetId(format, currentCount + 1);
}

/**
 * Extract the numeric part from a pet ID
 * @param petId - The pet ID (e.g., "MS/VC/0042")
 * @param format - The format string
 * @returns The number (e.g., 42)
 */
export function extractPetNumber(petId: string, format: string): number {
  // Find where the # symbols start in the format
  const hashIndex = format.indexOf('#');
  if (hashIndex === -1) return 0;
  
  // Extract the numeric part from the pet ID
  const numericPart = petId.substring(hashIndex);
  return parseInt(numericPart, 10) || 0;
}

/**
 * Validate if a pet ID matches the clinic's format
 * @param petId - The pet ID to validate (e.g., "MS/VC/0042")
 * @param format - The clinic's format (e.g., "MS/VC/####")
 * @returns true if valid, false otherwise
 */
export function validatePetIdFormat(petId: string, format: string): boolean {
  if (!petId || !format) return false;
  
  // Convert format to regex pattern
  // MS/VC/#### → ^MS\/VC\/\d{4}$
  // PET#### → ^PET\d{4}$
  
  // Escape special regex characters except #
  const escapedFormat = format.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Replace # symbols with \d (digit)
  const regexPattern = escapedFormat.replace(/#+/g, (match) => {
    return `\\d{${match.length}}`;
  });
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(petId);
}

/**
 * Get a preview of what IDs will look like
 * @param format - The format string
 * @returns Array of example IDs
 */
export function getFormatPreview(format: string): string[] {
  return [
    generatePetId(format, 1),
    generatePetId(format, 2),
    generatePetId(format, 42),
  ];
}