"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Activity, TrendingUp, Plus, FileText, Users, Stethoscope } from "lucide-react";
import QuickVisitDialog from "@/components/dashboard/quick-visit-dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardStats {
  totalPets: number;
  appointmentsToday: number;
  totalVisitsThisWeek: number;
  thisWeeksAppointments: Appointment[];
  visitHistory: Array<{ day: string; visits: number }>;
  appointmentsTrend?: number;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: string;
  pet: {
    name: string;
    owner: {
      name: string;
    };
  };
}

export default function DashboardClient() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPets: 0,
    appointmentsToday: 0,
    totalVisitsThisWeek: 0,
    thisWeeksAppointments: [],
    visitHistory: [],
  });
  const [loading, setLoading] = useState(true);
  const [showQuickVisit, setShowQuickVisit] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard/stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(":");
    const h = parseInt(hour);
    const period = h >= 12 ? "pm" : "am";
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:${minute} ${period}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-700";
      case "CANCELED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto py-8 px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600">Welcome back! Here's today's overview</p>
          </div>
          <Link href="/pets/new">
            <Button size="lg" className="bg-[#C00000] hover:bg-[#A00000]">
              <Plus className="h-4 w-4 mr-2" />
              Register New Pet
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/appointments" className="block group">
            <div className="bg-gradient-to-br from-pink-100 to-pink-50 rounded-xl p-6 border border-pink-200 hover:shadow-lg transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                {stats.appointmentsTrend !== undefined && stats.appointmentsTrend !== 0 && (
                  <TrendingUp className={`h-4 w-4 ${stats.appointmentsTrend > 0 ? 'text-green-600' : 'text-red-600'}`} />
                )}
              </div>
              <p className="text-sm text-slate-600 mb-1">Appointments Today</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-slate-900">{stats.appointmentsToday}</p>
                {stats.appointmentsTrend !== undefined ? (
                  <span className={`text-xs font-medium ${stats.appointmentsTrend > 0 ? 'text-green-600' : stats.appointmentsTrend < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                    {stats.appointmentsTrend === 0 ? '--' : `${stats.appointmentsTrend > 0 ? '+' : ''}${stats.appointmentsTrend}%`}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">--</span>
                )}
              </div>
            </div>
          </Link>

          <Link href="/pets" className="block group">
            <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-xl p-6 border border-green-200 hover:shadow-lg transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Activity className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-1">Total Pets</p>
              <p className="text-3xl font-bold text-slate-900">{stats.totalPets}</p>
            </div>
          </Link>

          <Link href="/reports" className="block group">
            <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl p-6 border border-orange-200 hover:shadow-lg transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-1">Visits This Week</p>
              <p className="text-3xl font-bold text-slate-900">{stats.totalVisitsThisWeek}</p>
            </div>
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Visit History Chart (spans 2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* UPGRADED VISIT HISTORY CHART WITH RECHARTS */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-md">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Visit History</h2>
                  <p className="text-sm text-slate-500">This week's overview</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-[#C00000]">{stats.totalVisitsThisWeek}</p>
                  <p className="text-xs text-slate-500">Total visits</p>
                </div>
              </div>
              
              {/* Recharts Bar Chart */}
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.visitHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="day" 
                    stroke="#64748b"
                    style={{ fontSize: '14px', fontWeight: '500' }}
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
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                    cursor={{ fill: 'rgba(192, 0, 0, 0.1)' }}
                  />
                  <Bar 
                    dataKey="visits" 
                    fill="url(#colorVisits)" 
                    radius={[8, 8, 0, 0]}
                    animationDuration={800}
                  />
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C00000" stopOpacity={1}/>
                      <stop offset="95%" stopColor="#E00000" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* This Week's Appointments */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">This Week's Appointments</h2>
                <Link href="/appointments">
                  <button className="text-sm text-[#C00000] hover:underline font-medium">View All →</button>
                </Link>
              </div>
              {stats.thisWeeksAppointments.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No appointments scheduled this week
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.thisWeeksAppointments.slice(0, 4).map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Activity className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{appointment.pet.name}</p>
                          <p className="text-xs text-slate-500">Owner: {appointment.pet.owner.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                        <p className="text-sm text-slate-600 font-medium min-w-[70px] text-right">
                          {formatTime(appointment.time)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link href="/pets/new">
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    New Pet Registration
                  </Button>
                </Link>
                <Button 
                  className="w-full justify-start bg-[#C00000] hover:bg-[#A00000] text-white"
                  onClick={() => setShowQuickVisit(true)}
                >
                  <Stethoscope className="h-4 w-4 mr-2" />
                  New Visit
                </Button>
                <Link href="/appointments">
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Appointment
                  </Button>
                </Link>
                <Link href="/owners">
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    View All Owners
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Visit Dialog */}
      <QuickVisitDialog
        open={showQuickVisit}
        onClose={() => setShowQuickVisit(false)}
      />
    </div>
  );
}