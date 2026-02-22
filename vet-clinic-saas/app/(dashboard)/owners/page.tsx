"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Printer, Phone, MapPin, Trash2, Edit } from "lucide-react";
import Link from "next/link";
import { exportToCSV } from "@/lib/csv-export";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import EditOwnerDialog from "@/components/owners/edit-owner-dialog";

interface Owner {
  id: string;
  idNumber: string;
  name: string;
  phone: string;
  address: string | null;
  createdAt: string;
  _count: {
    pets: number;
  };
}

export default function OwnersListPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  const [search, setSearch] = useState("");
  const [petCountFilter, setPetCountFilter] = useState("");
  const [sortBy, setSortBy] = useState("name_asc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchOwners = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (search) params.append("search", search);
      if (petCountFilter) params.append("petCount", petCountFilter);
      if (sortBy) params.append("sortBy", sortBy);

      const response = await fetch(`/api/owners/list?${params}`);
      const data = await response.json();

      setOwners(data.owners);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error("Failed to fetch owners:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
    setSelectedOwners([]); // Clear selection when filters change
  }, [page, search, petCountFilter, sortBy]);

  const handleExport = async () => {
    setExporting(true);
    const result = await exportToCSV("/api/owners/export", "owners-export");
    
    if (result.success) {
      alert(result.message);
    } else {
      alert(result.message);
    }
    
    setExporting(false);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOwners(owners.map(o => o.id));
    } else {
      setSelectedOwners([]);
    }
  };

  const handleSelectOwner = (ownerId: string) => {
    if (selectedOwners.includes(ownerId)) {
      setSelectedOwners(selectedOwners.filter(id => id !== ownerId));
    } else {
      setSelectedOwners([...selectedOwners, ownerId]);
    }
  };

  const getTotalPetsCount = () => {
    return selectedOwners.reduce((total, ownerId) => {
      const owner = owners.find(o => o.id === ownerId);
      return total + (owner?._count?.pets || 0);
    }, 0);
  };

  const handleBulkDelete = async () => {
    if (selectedOwners.length === 0) return;

    setDeleting(true);

    try {
      const deletePromises = selectedOwners.map(ownerId =>
        fetch(`/api/owners/${ownerId}`, { method: 'DELETE' })
      );

      await Promise.all(deletePromises);

      alert(`Successfully deleted ${selectedOwners.length} owner${selectedOwners.length > 1 ? 's' : ''}`);
      setSelectedOwners([]);
      setShowDeleteConfirm(false);
      fetchOwners();
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Failed to delete some owners. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto py-8 px-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Pet Owners</h1>
          <p className="text-slate-600 mt-2">Manage all pet owners</p>
        </div>

        {/* Toggle and Filters */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            {/* Toggle Tabs */}
            <div className="flex gap-2">
              <Link href="/pets">
                <button className="px-6 py-2 rounded-lg font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                  Pets
                </button>
              </Link>
              <button className="px-6 py-2 rounded-lg font-semibold bg-[#C00000] text-white shadow-md">
                Owners
              </button>
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search owners..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Pet Count Filter */}
            <select
              value={petCountFilter}
              onChange={(e) => {
                setPetCountFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Owners</option>
              <option value="0">No Pets</option>
              <option value="1">1 Pet</option>
              <option value="2-5">2-5 Pets</option>
              <option value="6+">6+ Pets</option>
            </select>

            {/* Sort By Filter */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="name_asc">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
              <option value="pets_desc">Most Pets</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>

            <Button variant="outline" onClick={handleExport} disabled={exporting}>
              <Printer className="h-4 w-4 mr-2" />
              {exporting ? "Exporting..." : "Export"}
            </Button>

            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(true)}
              disabled={selectedOwners.length === 0 || deleting}
              className={`${selectedOwners.length > 0 ? 'text-red-600 border-red-600 hover:bg-red-50' : 'opacity-50 cursor-not-allowed'}`}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? 'Deleting...' : `Delete${selectedOwners.length > 0 ? ` (${selectedOwners.length})` : ''}`}
            </Button>

            <Link href="/pets/new">
              <Button className="bg-[#C00000] hover:bg-[#A00000]">
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-pink-100 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 w-12">
                  <input
                    type="checkbox"
                    checked={selectedOwners.length === owners.length && owners.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Owner</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">ID Number</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Contact</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Address</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Total Pets</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    Loading owners...
                  </td>
                </tr>
              ) : owners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    No owners found
                  </td>
                </tr>
              ) : (
                owners.map((owner) => (
                  <tr key={owner.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={selectedOwners.includes(owner.id)}
                        onChange={() => handleSelectOwner(owner.id)}
                        className="w-4 h-4 rounded border-slate-300"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                          {owner.name.charAt(0)}
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{owner.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600">{owner.idNumber}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <a href={`tel:${owner.phone}`} className="text-[#C00000] hover:underline font-medium">
                          {owner.phone}
                        </a>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span>{owner.address || "N/A"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
                        {owner._count.pets}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingOwner(owner)}
                        className="text-slate-600 hover:text-[#C00000]"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
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
                Showing {(page - 1) * 10 + 1} - {Math.min(page * 10, total)} of {total} owners
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Owner Dialog */}
      {editingOwner && (
        <EditOwnerDialog
          open={!!editingOwner}
          owner={editingOwner}
          onClose={() => setEditingOwner(null)}
          onSuccess={() => {
            fetchOwners();
            setEditingOwner(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Owners"
        message={`Are you sure you want to delete ${selectedOwners.length} owner${selectedOwners.length > 1 ? 's' : ''}? This will also delete ALL ${getTotalPetsCount()} of their pet${getTotalPetsCount() !== 1 ? 's' : ''}, along with all visits, notes, and appointments. This action cannot be undone.`}
        confirmText="Delete"
        loading={deleting}
      />
    </div>
  );
}