/**
 * Export reports to PDF
 * Note: This creates a simple HTML page and uses browser's print-to-PDF
 * For production, consider using jsPDF library for more control
 */

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

export function exportReportsToPDF(data: ReportData): void {
  // Create HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${data.reportInfo.clinicName} - ${data.reportInfo.reportPeriod} Report</title>
      <style>
        @media print {
          @page { margin: 1cm; size: A4; }
          body { margin: 0; }
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 40px;
          max-width: 210mm;
          margin: 0 auto;
          color: #1e293b;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #c00000;
        }
        
        .clinic-name {
          font-size: 32px;
          font-weight: bold;
          color: #c00000;
          margin-bottom: 10px;
        }
        
        .report-title {
          font-size: 24px;
          color: #475569;
          margin-bottom: 5px;
        }
        
        .report-meta {
          font-size: 14px;
          color: #64748b;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin: 30px 0;
        }
        
        .summary-card {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          border: 1px solid #cbd5e1;
        }
        
        .summary-label {
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        
        .summary-value {
          font-size: 36px;
          font-weight: bold;
          color: #0f172a;
        }
        
        .section {
          margin: 30px 0;
          page-break-inside: avoid;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #1e293b;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e2e8f0;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        
        th {
          background-color: #fce7f3;
          color: #831843;
          padding: 12px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 13px;
        }
        
        tr:hover {
          background-color: #f8fafc;
        }
        
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
        }
        
        .reason-bar {
          display: inline-block;
          height: 20px;
          background: linear-gradient(90deg, #c00000 0%, #f43f5e 100%);
          border-radius: 4px;
          margin-right: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="clinic-name">${data.reportInfo.clinicName}</div>
        <div class="report-title">Clinic Report - ${data.reportInfo.reportPeriod}</div>
        <div class="report-meta">
          ${data.reportInfo.clinicLocation} | ${data.reportInfo.clinicPhone}<br/>
          Generated on ${data.reportInfo.generatedDate}
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-label">Total Visits</div>
          <div class="summary-value">${data.summary.totalVisits}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">New Pets</div>
          <div class="summary-value">${data.summary.newPets}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Total Appointments</div>
          <div class="summary-value">${data.summary.totalAppointments}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Visit & Appointment History</div>
        <table>
          <thead>
            <tr>
              <th>Period</th>
              <th>Visits</th>
              <th>Appointments</th>
            </tr>
          </thead>
          <tbody>
            ${data.visitHistory.map(item => `
              <tr>
                <td>${item.period}</td>
                <td>${item.visits}</td>
                <td>${item.appointments}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Most Common Visit Reasons</div>
        <table>
          <thead>
            <tr>
              <th>Reason</th>
              <th>Count</th>
              <th>Percentage</th>
              <th style="width: 200px;">Distribution</th>
            </tr>
          </thead>
          <tbody>
            ${data.commonReasons.map(item => `
              <tr>
                <td>${item.reason}</td>
                <td>${item.count}</td>
                <td>${item.percentage}%</td>
                <td>
                  <div class="reason-bar" style="width: ${item.percentage}%;"></div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Top Pets by Visit Count</div>
        <table>
          <thead>
            <tr>
              <th>Pet Name</th>
              <th>Species</th>
              <th>Breed</th>
              <th>Visits</th>
              <th>Last Visit</th>
            </tr>
          </thead>
          <tbody>
            ${data.topPets.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.species}</td>
                <td>${item.breed}</td>
                <td>${item.visits}</td>
                <td>${item.lastVisit}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Vet Performance</div>
        <table>
          <thead>
            <tr>
              <th>Vet Name</th>
              <th>Total Appointments</th>
              <th>Completed</th>
              <th>Completion Rate</th>
            </tr>
          </thead>
          <tbody>
            ${data.vetPerformance.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.totalAppointments}</td>
                <td>${item.completedAppointments}</td>
                <td>${item.completionRate}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p>This report was automatically generated by Dr. Paw Clinic Management System</p>
        <p>&copy; ${new Date().getFullYear()} Dr. Paw. All rights reserved.</p>
      </div>

      <script>
        // Auto-trigger print dialog
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  // Create a new window with the HTML content
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    alert('Please allow popups to download the PDF report');
  }
}