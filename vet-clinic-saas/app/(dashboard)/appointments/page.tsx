"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Trash2, Calendar, Printer, Upload } from "lucide-react";
import { Select } from "@/components/ui/select";
import AddAppointmentDialog from "@/components/appointments/add-appointment-dialog";
import EditAppointmentDialog from "@/components/appointments/edit-appointment-dialog";
import ImportAppointmentsDialog from "@/components/appointments/import-appointments-dialog";
import { exportToCSV } from "@/lib/csv-export";

interface Appointment {
  id: string;
  date: string;
  time: string;
  reason: string;
  status: "CONFIRMED" | "CANCELED" | "COMPLETED";
  pet: {
    id: string;
    name: string;
    species: string;
    breed: string | null;
  };
  vet: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
  petId: string;
  vetId: string;
  clinicId: string;
  createdAt: string;
  updatedAt: string;
}

interface Owner {
  name: string;
  phone: string;
}

interface AppointmentWithOwner extends Appointment {
  pet: Appointment["pet"] & {
    owner: Owner;
  };
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ today: 0, canceled: 0, total: 0 });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithOwner | null>(null);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (dateFilter) params.append("date", dateFilter);

      const response = await fetch(`/api/appointments/list?${params}`);
      const data = await response.json();

      setAppointments(data.appointments);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
      setStats(data.stats);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [page, search, statusFilter, dateFilter]);

  const handleExport = async () => {
    setExporting(true);
    const result = await exportToCSV("/api/appointments/export", "appointments-export");
    
    if (result.success) {
      alert(result.message);
    } else {
      alert(result.message);
    }
    
    setExporting(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      CONFIRMED: "bg-green-100 text-green-700 border border-green-300",
      CANCELED: "bg-red-100 text-red-700 border border-red-300",
      COMPLETED: "bg-blue-100 text-blue-700 border border-blue-300",
    };
    return styles[status as keyof typeof styles] || "";
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this appointment?")) return;

    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchAppointments();
      }
    } catch (error) {
      console.error("Failed to delete appointment:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto py-8 px-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Appointments</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-pink-100 to-pink-50 rounded-xl p-6 border border-pink-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Appointments Today</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-slate-900">{stats.today}</p>
                  <span className="text-sm text-slate-400">--</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Canceled Appointments</p>
                <p className="text-2xl font-bold text-slate-900">{stats.canceled}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Appointments</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            {/* Status Filter */}
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-[180px]"
            >
              <option value="all">All Status</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELED">Canceled</option>
              <option value="COMPLETED">Completed</option>
            </Select>

            {/* Date Filter */}
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-[200px]"
            />

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search appoint.."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button variant="outline" onClick={handleExport} disabled={exporting}>
              <Printer className="h-4 w-4 mr-2" />
              {exporting ? "Exporting..." : "Export"}
            </Button>

            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>

            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-[#C00000] hover:bg-[#A00000]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>

            <Button variant="outline" className="text-[#C00000] border-[#C00000]">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-pink-100 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Time</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Pet</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Owner</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Reason</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Vet</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    Loading appointments...
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    No appointments found
                  </td>
                </tr>
              ) : (
                appointments.map((appointment) => (
                  <tr
                    key={appointment.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedAppointment(appointment);
                      setShowEditDialog(true);
                    }}
                  >
                    <td className="py-4 px-4 text-sm text-slate-900">
                      {formatDate(appointment.date)}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-900">
                      {appointment.time}
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {appointment.pet.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {appointment.pet.species}, {appointment.pet.breed || "Mixed"}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {appointment.pet.owner.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {appointment.pet.owner.phone}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600">
                      {appointment.reason}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-900">
                      {appointment.vet.firstName && appointment.vet.lastName
                        ? `Dr ${appointment.vet.firstName} ${appointment.vet.lastName}`
                        : "Unassigned"}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                          appointment.status
                        )}`}
                      >
                        {appointment.status.charAt(0) + appointment.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                Showing {(page - 1) * 10 + 1} - {Math.min(page * 10, total)} of {total} appointments
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  ← Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="bg-[#C00000] text-white hover:bg-[#A00000]"
                >
                  Next »
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Appointment Dialog */}
      <AddAppointmentDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={() => {
          setShowAddDialog(false);
          fetchAppointments();
        }}
      />

      {/* Edit Appointment Dialog */}
      <EditAppointmentDialog
        open={showEditDialog}
        appointment={selectedAppointment}
        onClose={() => {
          setShowEditDialog(false);
          setSelectedAppointment(null);
        }}
        onSuccess={() => {
          setShowEditDialog(false);
          setSelectedAppointment(null);
          fetchAppointments();
        }}
      />

      {/* Import Appointments Dialog */}
      <ImportAppointmentsDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onSuccess={() => {
          setShowImportDialog(false);
          fetchAppointments();
        }}
      />
    </div>
  );
}