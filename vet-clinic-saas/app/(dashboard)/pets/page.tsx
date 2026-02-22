"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Search, Plus, Printer, Upload } from "lucide-react";
import Link from "next/link";
import { exportToCSV } from "@/lib/csv-export";
import ImportPetsDialog from "@/components/pets/import-pets-dialog";
import { Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/confirm-dialog";

interface Pet {
  id: string;
  idNumber: string;
  name: string;
  species: string;
  breed: string | null;
  sex: string;
  color: string | null;
  status: string;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    phone: string;
  };
}

export default function PetsListPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedPets, setSelectedPets] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchPets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (search) params.append("search", search);
      if (speciesFilter) params.append("species", speciesFilter);
      if (statusFilter) params.append("status", statusFilter);

      const response = await fetch(`/api/pets/list?${params}`);
      const data = await response.json();

      setPets(data.pets);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error("Failed to fetch pets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
    setSelectedPets([]); // Clear selection when filters change
  }, [page, search, speciesFilter, statusFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
    });
  };

  const handleExport = async () => {
    setExporting(true);
    const result = await exportToCSV("/api/pets/export", "pets-export");
    
    if (result.success) {
      alert(result.message);
    } else {
      alert(result.message);
    }
    
    setExporting(false);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedPets(pets.map(p => p.id));
    } else {
      setSelectedPets([]);
    }
  };

  const handleSelectPet = (petId: string) => {
    if (selectedPets.includes(petId)) {
      setSelectedPets(selectedPets.filter(id => id !== petId));
    } else {
      setSelectedPets([...selectedPets, petId]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPets.length === 0) return;

    setDeleting(true);

    try {
      const deletePromises = selectedPets.map(petId =>
        fetch(`/api/pets/${petId}`, { method: 'DELETE' })
      );

      await Promise.all(deletePromises);

      alert(`Successfully deleted ${selectedPets.length} pet${selectedPets.length > 1 ? 's' : ''}`);
      setSelectedPets([]);
      setShowDeleteConfirm(false);
      fetchPets();
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Failed to delete some pets. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto py-8 px-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Pets</h1>
          <p className="text-slate-600 mt-2">Manage all registered pets</p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search pets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value)}
              className="w-48"
            >
              <option value="">All Species</option>
              <option value="Dog">Dog</option>
              <option value="Cat">Cat</option>
              <option value="Bird">Bird</option>
              <option value="Rabbit">Rabbit</option>
              <option value="Other">Other</option>
            </Select>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-48"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="DECEASED">Deceased</option>
              <option value="TRANSFERRED">Transferred</option>
            </Select>

            <Button variant="outline" onClick={handleExport} disabled={exporting}>
              <Printer className="h-4 w-4 mr-2" />
              {exporting ? "Exporting..." : "Export"}
            </Button>

            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>

            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(true)}
              disabled={selectedPets.length === 0 || deleting}
              className={`${selectedPets.length > 0 ? 'text-red-600 border-red-600 hover:bg-red-50' : 'opacity-50 cursor-not-allowed'}`}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? 'Deleting...' : `Delete${selectedPets.length > 0 ? ` (${selectedPets.length})` : ''}`}
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
          <table className="w-full min-w-[800px]">
            <thead className="bg-pink-100 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 w-12">
                  <input
                    type="checkbox"
                    checked={selectedPets.length === pets.length && pets.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Pet Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">ID Number</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Species/Breed</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Sex/Color</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Last Visit</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Owner Info</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500">
                    Loading pets...
                  </td>
                </tr>
              ) : pets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500">
                    No pets found
                  </td>
                </tr>
              ) : (
                pets.map((pet) => (
                  <tr key={pet.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedPets.includes(pet.id)}
                        onChange={() => handleSelectPet(pet.id)}
                        className="w-4 h-4 rounded border-slate-300"
                      />
                    </td>
                    <td className="py-3 px-4 text-sm">
                        <Link href={`/pets/${pet.id}`} className="text-[#C00000] hover:text-[#A00000] font-semibold hover:underline">
                            {pet.name}
                        </Link>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{pet.idNumber}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {pet.species}{pet.breed ? `, ${pet.breed}` : ""}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {pet.sex}{pet.color ? `, ${pet.color}` : ""}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {formatDate(pet.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{pet.owner.name}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          pet.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : pet.status === "DECEASED"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {pet.status === "ACTIVE" ? "Active" : pet.status === "DECEASED" ? "Dead" : "Transferred"}
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
                Showing {(page - 1) * 10 + 1} - {Math.min(page * 10, total)} of {total} pets
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

      {/* Import Dialog */}
      <ImportPetsDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onSuccess={() => {
          fetchPets();
          setShowImportDialog(false);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Pets"
        message={`Are you sure you want to delete ${selectedPets.length} pet${selectedPets.length > 1 ? 's' : ''}? This will also delete all their visits, notes, and appointments. This action cannot be undone.`}
        confirmText="Delete"
        loading={deleting}
      />
    </div>
  );
}