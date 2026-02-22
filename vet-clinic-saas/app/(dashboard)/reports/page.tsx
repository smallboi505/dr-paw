"use client";

import { useEffect, useState } from "react";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportReportsToCSV } from "@/lib/reports-csv-export";
import { exportReportsToPDF } from "@/lib/reports-pdf-export";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ReportsData {
  totalVisits: number;
  newPets: number;
  totalAppointments: number;
  visitHistory: Array<{ month: string; count: number }>;
  appointmentHistory: Array<{ month: string; count: number }>;
  commonReasons: Array<{ reason: string; count: number; percentage: number }>;
  topPets: Array<{
    id: string;
    name: string;
    species: string;
    breed: string | null;
    visits: number;
    lastVisit: string | null;
  }>;
  vetPerformance: Array<{
    id: string;
    name: string;
    appointments: number;
    completionRate: number;
  }>;
}

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export default function ReportsPage() {
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [data, setData] = useState<ReportsData>({
    totalVisits: 0,
    newPets: 0,
    totalAppointments: 0,
    visitHistory: [],
    appointmentHistory: [],
    commonReasons: [],
    topPets: [],
    vetPerformance: [],
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const years = ["2026", "2025", "2024", "2023", "2022"];
  const months = ["All", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  useEffect(() => {
    fetchReportsData();
  }, [selectedYear, selectedMonth]);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedYear) params.append("year", selectedYear);
      if (selectedMonth) params.append("month", selectedMonth);

      const response = await fetch(`/api/reports?${params.toString()}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (selectedYear) params.append("year", selectedYear);
      if (selectedMonth) params.append("month", selectedMonth);

      const response = await fetch(`/api/reports/export?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        const exportData = {
          reportInfo: result.reportInfo,
          summary: result.summary,
          visitHistory: result.visitHistory,
          commonReasons: result.commonReasons,
          topPets: result.topPets,
          vetPerformance: result.vetPerformance,
        };
        
        exportReportsToCSV(exportData);
        alert("CSV report downloaded successfully!");
      } else {
        alert("Failed to export report");
      }
    } catch (error) {
      console.error("Export CSV error:", error);
      alert("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (selectedYear) params.append("year", selectedYear);
      if (selectedMonth) params.append("month", selectedMonth);

      const response = await fetch(`/api/reports/export?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        const exportData = {
          reportInfo: result.reportInfo,
          summary: result.summary,
          visitHistory: result.visitHistory,
          commonReasons: result.commonReasons,
          topPets: result.topPets,
          vetPerformance: result.vetPerformance,
        };
        
        exportReportsToPDF(exportData);
      } else {
        alert("Failed to export report");
      }
    } catch (error) {
      console.error("Export PDF error:", error);
      alert("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  // Combine visit and appointment data for dual-axis chart
  const combinedChartData = data.visitHistory.map((visit, index) => ({
    month: visit.month,
    visits: visit.count,
    appointments: data.appointmentHistory[index]?.count || 0,
  }));

  // Calculate growth percentages
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const visitGrowth = data.visitHistory.length >= 2 
    ? calculateGrowth(
        data.visitHistory[data.visitHistory.length - 1]?.count || 0,
        data.visitHistory[data.visitHistory.length - 2]?.count || 0
      )
    : 0;

  const petGrowth = 12; // Mock growth - would calculate from API in production

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-600">Interactive insights for your clinic</p>
        </div>

        {/* Stats Cards with Growth Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Visits */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-pink-100">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              {visitGrowth !== 0 && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                  visitGrowth > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {visitGrowth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(visitGrowth)}%
                </div>
              )}
            </div>
            <p className="text-sm text-slate-600 mb-1">Total Visits</p>
            <p className="text-3xl font-bold text-slate-900">{data.totalVisits}</p>
            <p className="text-xs text-slate-500 mt-1">This year</p>
          </div>

          {/* New Pets */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-blue-100">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                <TrendingUp className="h-3 w-3" />
                {petGrowth}%
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-1">New Pets</p>
            <p className="text-3xl font-bold text-slate-900">{data.newPets}</p>
            <p className="text-xs text-slate-500 mt-1">This year</p>
          </div>

          {/* Total Appointments */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-purple-100">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-1">Appointments</p>
            <p className="text-3xl font-bold text-slate-900">{data.totalAppointments}</p>
            <p className="text-xs text-slate-500 mt-1">This year</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex items-center gap-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {months.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>

          <div className="flex-1" />

          <Button variant="outline" onClick={handleExportCSV} disabled={exporting}>
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Exporting..." : "Export CSV"}
          </Button>

          <Button variant="outline" onClick={handleExportPDF} disabled={exporting}>
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Exporting..." : "Export PDF"}
          </Button>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Visit & Appointment Trends - Line Chart */}
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Visit & Appointment Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={combinedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="visits" 
                  stroke="#ec4899" 
                  strokeWidth={3}
                  dot={{ fill: '#ec4899', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Visits"
                />
                <Line 
                  type="monotone" 
                  dataKey="appointments" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Appointments"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Common Reasons - Pie Chart */}
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Visit Reasons Distribution</h2>
            {data.commonReasons.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.commonReasons}
                    dataKey="count"
                    nameKey="reason"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry: any) => `${entry.reason}: ${entry.percentage}%`}
                    labelLine={true}
                  >
                    {data.commonReasons.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Pets */}
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Top Pets by Visits</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-pink-100 to-purple-100 text-left">
                    <th className="px-4 py-3 text-sm font-semibold text-slate-700 rounded-tl-lg">Pet Name</th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-700">Visits</th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-700">Species/Breed</th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-700 rounded-tr-lg">Last Visit</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPets.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-500">
                        No visits recorded yet
                      </td>
                    </tr>
                  ) : (
                    data.topPets.map((pet, i) => (
                      <tr key={pet.id} className="border-b border-slate-100 hover:bg-purple-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{pet.name}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-sm">
                            {pet.visits}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {pet.species}
                          {pet.breed && `, ${pet.breed}`}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{formatDate(pet.lastVisit)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vet Performance - Bar Chart */}
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Vet Performance</h2>
            {data.vetPerformance.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                No vet data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.vetPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="appointments" 
                    fill="#8b5cf6" 
                    radius={[8, 8, 0, 0]}
                    name="Appointments"
                  />
                  <Bar 
                    dataKey="completionRate" 
                    fill="#10b981" 
                    radius={[8, 8, 0, 0]}
                    name="Completion Rate %"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}