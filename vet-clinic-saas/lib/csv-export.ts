/**
 * Convert array of objects to CSV string
 */
export function convertToCSV(data: any[]): string {
  if (data.length === 0) return "";

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create header row
  const headerRow = headers.join(",");
  
  // Create data rows
  const dataRows = data.map((row) => {
    return headers
      .map((header) => {
        const value = row[header];
        
        // Handle null/undefined
        if (value === null || value === undefined) return "";
        
        // Convert to string
        const stringValue = String(value);
        
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        
        return stringValue;
      })
      .join(",");
  });
  
  // Combine header and data rows
  return [headerRow, ...dataRows].join("\n");
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string) {
  // Create blob
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  
  // Create download link
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Generate filename with current date
 */
export function generateExportFilename(prefix: string): string {
  const date = new Date();
  const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD
  return `${prefix}-${dateString}.csv`;
}

/**
 * Export data to CSV (combines all steps)
 */
export async function exportToCSV(
  apiEndpoint: string,
  filenamePrefix: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Fetch data from API
    const response = await fetch(apiEndpoint);
    
    if (!response.ok) {
      throw new Error("Failed to fetch export data");
    }
    
    const result = await response.json();
    
    if (!result.success || !result.data || result.data.length === 0) {
      return {
        success: false,
        message: "No data available to export",
      };
    }
    
    // Convert to CSV
    const csvContent = convertToCSV(result.data);
    
    // Generate filename
    const filename = generateExportFilename(filenamePrefix);
    
    // Download
    downloadCSV(csvContent, filename);
    
    return {
      success: true,
      message: `Successfully exported ${result.total} records`,
    };
  } catch (error) {
    console.error("Export error:", error);
    return {
      success: false,
      message: "Failed to export data. Please try again.",
    };
  }
}