"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Pencil, Trash2, Mail } from "lucide-react";
import AddStaffDialog from "./add-staff-dialog";
import EditStaffDialog from "./edit-staff-dialog";
import InviteStaffDialog from "./invite-staff-dialog";
import { getPermissions, type UserRole } from "@/lib/permissions";

interface Staff {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: "ADMIN" | "VET" | "NURSE" | "RECEPTION";
  createdAt: string;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

export default function StaffSettings() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // Fetch user role
  useEffect(() => {
    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((data) => setUserRole(data.role as UserRole))
      .catch(() => {});
  }, []);

  const permissions = userRole ? getPermissions(userRole) : null;

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/staff");
      if (response.ok) {
        const data = await response.json();
        setStaff(data.staff);
      }
    } catch (error) {
      console.error("Failed to fetch staff:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvites = async () => {
    try {
      const response = await fetch("/api/invites/list");
      if (response.ok) {
        const data = await response.json();
        setInvites(data.invites || []);
      }
    } catch (error) {
      console.error("Failed to fetch invites:", error);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchInvites();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;

    try {
      const response = await fetch(`/api/staff/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchStaff();
      } else {
        alert("Failed to delete staff member");
      }
    } catch (error) {
      console.error("Failed to delete staff:", error);
      alert("Failed to delete staff member");
    }
  };

  const filteredStaff = staff.filter(
    (member) =>
      member.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      member.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      member.email.toLowerCase().includes(search.toLowerCase()) ||
      member.role.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      ADMIN: "bg-purple-100 text-purple-700 border-purple-300",
      VET: "bg-blue-100 text-blue-700 border-blue-300",
      NURSE: "bg-green-100 text-green-700 border-green-300",
      RECEPTION: "bg-orange-100 text-orange-700 border-orange-300",
    };
    return colors[role as keyof typeof colors] || "bg-slate-100 text-slate-700";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Staff Management</h2>
          <p className="text-slate-600 mt-1">Manage your clinic team members</p>
        </div>
        {permissions?.canInviteStaff && (
          <div className="flex gap-3">
            <Button
              onClick={() => setShowInviteDialog(true)}
              variant="outline"
              className="border-[#C00000] text-[#C00000] hover:bg-red-50"
            >
              <Mail className="h-4 w-4 mr-2" />
              Invite Staff
            </Button>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-[#C00000] hover:bg-[#A00000]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-sm text-slate-600">Total Staff</p>
          <p className="text-2xl font-bold text-slate-900">{staff.length}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-slate-600">Vets</p>
          <p className="text-2xl font-bold text-slate-900">
            {staff.filter((s) => s.role === "VET").length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-slate-600">Nurses</p>
          <p className="text-2xl font-bold text-slate-900">
            {staff.filter((s) => s.role === "NURSE").length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg p-4 border border-orange-200">
          <p className="text-sm text-slate-600">Reception</p>
          <p className="text-2xl font-bold text-slate-900">
            {staff.filter((s) => s.role === "RECEPTION").length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search staff by name, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Pending Invites - ADMIN ONLY */}
      {permissions?.canInviteStaff && invites.filter(i => i.status === "PENDING").length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Pending Invites ({invites.filter(i => i.status === "PENDING").length})
          </h3>
          <div className="space-y-2">
            {invites.filter(i => i.status === "PENDING").map((invite) => (
              <div key={invite.id} className="flex items-center justify-between bg-white rounded p-3 border border-yellow-300">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{invite.email}</p>
                  <p className="text-sm text-slate-600">
                    {invite.role} • Invited {new Date(invite.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/invites/${invite.id}/resend`, {
                          method: "POST",
                        });
                        if (response.ok) {
                          alert("Invite resent!");
                        }
                      } catch (error) {
                        console.error("Failed to resend:", error);
                      }
                    }}
                  >
                    Resend
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                    onClick={async () => {
                      if (!confirm("Cancel this invite?")) return;
                      try {
                        const response = await fetch(`/api/invites/${invite.id}/cancel`, {
                          method: "POST",
                        });
                        if (response.ok) {
                          fetchInvites();
                        }
                      } catch (error) {
                        console.error("Failed to cancel:", error);
                      }
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-pink-100 border-b border-slate-200">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">
                Name
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">
                Email
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">
                Role
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-slate-500">
                  Loading staff...
                </td>
              </tr>
            ) : filteredStaff.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-slate-500">
                  No staff members found
                </td>
              </tr>
            ) : (
              filteredStaff.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                        {member.firstName?.charAt(0) || member.email.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        {member.firstName && member.lastName
                          ? `${member.firstName} ${member.lastName}`
                          : member.email}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-600">
                    {member.email}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(
                        member.role
                      )}`}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      {permissions?.canEditStaff && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedStaff(member);
                              setShowEditDialog(true);
                            }}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4 text-slate-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(member.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Dialogs */}
      <AddStaffDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={() => {
          setShowAddDialog(false);
          fetchStaff();
        }}
      />

      <EditStaffDialog
        open={showEditDialog}
        staff={selectedStaff}
        onClose={() => {
          setShowEditDialog(false);
          setSelectedStaff(null);
        }}
        onSuccess={() => {
          setShowEditDialog(false);
          setSelectedStaff(null);
          fetchStaff();
        }}
      />

      <InviteStaffDialog
        open={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
        onSuccess={() => {
          setShowInviteDialog(false);
          fetchStaff();
          fetchInvites();
        }}
      />
    </div>
  );
}