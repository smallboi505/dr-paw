import { downloadCSV } from "./csv-export";

interface ReportData {
  reportInfo: {
    clinicName: string;
    clinicLocation: string;
    clinicPhone: string;
    reportPeriod: string;
    generatedDate: string;
  };
  summary: {
    totalVisits: number;
    newPets: number;
    totalAppointments: number;
  };
  visitHistory: Array<{ period: string; visits: number; appointments: number }>;
  commonReasons: Array<{ reason: string; count: number; percentage: number }>;
  topPets: Array<{ name: string; species: string; breed: string; visits: number; lastVisit: string }>;
  vetPerformance: Array<{ name: string; totalAppointments: number; completedAppointments: number; completionRate: string }>;
}

/**
 * Export reports data to CSV with multiple sections
 */
export function exportReportsToCSV(data: ReportData): void {
  const sections = [];

  // Report Header
  sections.push("CLINIC REPORT");
  sections.push(`Clinic Name,${data.reportInfo.clinicName}`);
  sections.push(`Location,${data.reportInfo.clinicLocation}`);
  sections.push(`Phone,${data.reportInfo.clinicPhone}`);
  sections.push(`Report Period,${data.reportInfo.reportPeriod}`);
  sections.push(`Generated Date,${data.reportInfo.generatedDate}`);
  sections.push(""); // Empty line

  // Summary Stats
  sections.push("SUMMARY STATISTICS");
  sections.push("Metric,Value");
  sections.push(`Total Visits,${data.summary.totalVisits}`);
  sections.push(`New Pets,${data.summary.newPets}`);
  sections.push(`Total Appointments,${data.summary.totalAppointments}`);
  sections.push(""); // Empty line

  // Visit History
  sections.push("VISIT & APPOINTMENT HISTORY");
  sections.push("Period,Visits,Appointments");
  data.visitHistory.forEach((item) => {
    sections.push(`${item.period},${item.visits},${item.appointments}`);
  });
  sections.push(""); // Empty line

  // Common Reasons
  sections.push("MOST COMMON VISIT REASONS");
  sections.push("Reason,Count,Percentage");
  data.commonReasons.forEach((item) => {
    sections.push(`${item.reason},${item.count},${item.percentage}%`);
  });
  sections.push(""); // Empty line

  // Top Pets
  sections.push("TOP PETS BY VISIT COUNT");
  sections.push("Pet Name,Species,Breed,Total Visits,Last Visit");
  data.topPets.forEach((item) => {
    sections.push(`${item.name},${item.species},${item.breed},${item.visits},${item.lastVisit}`);
  });
  sections.push(""); // Empty line

  // Vet Performance
  sections.push("VET PERFORMANCE");
  sections.push("Vet Name,Total Appointments,Completed Appointments,Completion Rate");
  data.vetPerformance.forEach((item) => {
    sections.push(`${item.name},${item.totalAppointments},${item.completedAppointments},${item.completionRate}`);
  });

  // Combine all sections
  const csvContent = sections.join("\n");

  // Generate filename
  const filename = `clinic-report-${data.reportInfo.reportPeriod.replace(/\s+/g, "-")}-${Date.now()}.csv`;

  // Download
  downloadCSV(csvContent, filename);
}