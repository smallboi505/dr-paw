"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Plus, Phone, MapPin, Calendar, FileText, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import Link from "next/link";
import NewVisitDialog from "@/components/pets/new-visit-dialog";
import SaveNoteDialog from "@/components/pets/save-note-dialog";
import EditPetDialog from "@/components/pets/edit-pet-dialog";
import EditVisitDialog from "@/components/pets/edit-visit-dialog";

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
    idNumber: string;
    name: string;
    phone: string;
    address: string | null;
  };
}

interface Visit {
  id: string;
  date: string;
  history: string | null;
  diagnosis: string | null;
  treatment: string | null;
  notes: string | null;
}

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function PetDetailPage() {
  const params = useParams();
  const [pet, setPet] = useState<Pet | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"history" | "notes">("history");
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [showNewVisitDialog, setShowNewVisitDialog] = useState(false);
  const [showSaveNoteDialog, setShowSaveNoteDialog] = useState(false);
  const [showEditPetDialog, setShowEditPetDialog] = useState(false);
  const [showEditVisitDialog, setShowEditVisitDialog] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchPetDetails(params.id as string);
    }
  }, [params.id]);

  const fetchPetDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/pets/${id}`);
      const data = await response.json();
      setPet(data.pet);
      setVisits(data.visits || []);
      setNotes(data.notes || []);
    } catch (error) {
      console.error("Failed to fetch pet details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async (title: string) => {
    if (!pet || !newNote.trim()) return;

    try {
      const response = await fetch(`/api/pets/${pet.id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content: newNote,
        }),
      });

      if (response.ok) {
        setShowSaveNoteDialog(false);
        setNewNote("");
        fetchPetDetails(pet.id);
      } else {
        alert("Failed to save note");
      }
    } catch (error) {
      console.error("Failed to save note:", error);
      alert("Failed to save note");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatDetailedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#C00000] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading pet details...</p>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Pet not found</p>
          <Link href="/pets">
            <Button>Back to Pets</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto py-8 px-6">
        {/* Header with Back Button */}
        <Link href="/pets">
          <Button variant="ghost" size="sm" className="mb-6 text-[#C00000] hover:text-[#A00000]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pets
          </Button>
        </Link>

        <div className="grid grid-cols-3 gap-6">
          {/* Left Sidebar - Pet & Owner Info */}
          <div className="space-y-6">
            {/* Pet Info Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Pet Header with Edit */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-4 right-4 text-white hover:bg-white/20"
                  onClick={() => setShowEditPetDialog(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mb-4 border-4 border-white/30">
                  <span className="text-4xl">🐾</span>
                </div>
                <h1 className="text-3xl font-bold mb-1">{pet.name}</h1>
                <p className="text-sm opacity-90">{pet.idNumber}</p>
              </div>

              {/* Pet Details */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Species</p>
                    <p className="text-sm font-semibold text-slate-900">{pet.species}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Breed</p>
                    <p className="text-sm font-semibold text-slate-900">{pet.breed || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Sex</p>
                    <p className="text-sm font-semibold text-slate-900">{pet.sex}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Color</p>
                    <p className="text-sm font-semibold text-slate-900">{pet.color || "N/A"}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Status</p>
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
                      pet.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : pet.status === "DECEASED"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      pet.status === "ACTIVE" ? "bg-green-500" :
                      pet.status === "DECEASED" ? "bg-red-500" : "bg-yellow-500"
                    }`} />
                    {pet.status}
                  </span>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Registered</p>
                  <div className="flex items-center gap-2 text-sm text-slate-900">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">{formatDetailedDate(pet.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Owner Info Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {pet.owner.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{pet.owner.name}</h3>
                  <p className="text-xs text-slate-500">Pet Owner</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">Phone</p>
                    <a href={`tel:${pet.owner.phone}`} className="text-sm font-semibold text-[#C00000] hover:underline">
                      {pet.owner.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">Owner ID</p>
                    <p className="text-sm font-semibold text-slate-900">{pet.owner.idNumber}</p>
                  </div>
                </div>

                {pet.owner.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1">Address</p>
                      <p className="text-sm font-medium text-slate-900">{pet.owner.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Note Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 mb-4">Note</h3>
              <textarea
                className="w-full h-28 p-3 text-sm text-slate-900 placeholder:text-slate-600 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#C00000] focus:border-transparent"
                placeholder="note here...."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <Button 
                className="w-full mt-3"
                onClick={() => {
                  if (newNote.trim()) {
                    setShowSaveNoteDialog(true);
                  }
                }}
                disabled={!newNote.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          {/* Right Main Content - Visit History & Notes */}
          <div className="col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              {/* Tabs Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab("history")}
                    className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                      activeTab === "history"
                        ? "bg-[#C00000] text-white shadow-md"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Visit History
                  </button>
                  <button
                    onClick={() => setActiveTab("notes")}
                    className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                      activeTab === "notes"
                        ? "bg-[#C00000] text-white shadow-md"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Notes
                  </button>
                </div>
                <Button onClick={() => setShowNewVisitDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Visit
                </Button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === "history" && (
                  <div className="space-y-4">
                    {visits.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileText className="h-8 w-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium mb-2">No visit history yet</p>
                        <p className="text-sm text-slate-400">Medical visits will appear here</p>
                      </div>
                    ) : (
                      visits.map((visit) => (
                        <div
                          key={visit.id}
                          className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all"
                        >
                          {/* Visit Header */}
                          <div
                            className="bg-slate-50 p-4 flex items-center justify-between"
                          >
                            <div 
                              className="flex items-center gap-3 flex-1 cursor-pointer"
                              onClick={() => setExpandedVisit(expandedVisit === visit.id ? null : visit.id)}
                            >
                              <div className="w-10 h-10 bg-[#C00000] rounded-lg flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{formatDate(visit.date)}</p>
                                <p className="text-xs text-slate-500">Click to view details</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingVisit(visit);
                                  setShowEditVisitDialog(true);
                                }}
                                className="text-slate-600 hover:text-[#C00000]"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {expandedVisit === visit.id ? (
                                <ChevronUp className="h-5 w-5 text-slate-400" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-slate-400" />
                              )}
                            </div>
                          </div>

                          {/* Expanded Visit Details */}
                          {expandedVisit === visit.id && (
                            <div className="p-6 space-y-4 bg-white">
                              {visit.history && (
                                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">History:</p>
                                  <p className="text-sm text-slate-900 leading-relaxed">{visit.history}</p>
                                </div>
                              )}
                              {visit.diagnosis && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Diagnosis:</p>
                                  <p className="text-sm text-slate-900 leading-relaxed">{visit.diagnosis}</p>
                                </div>
                              )}
                              {visit.treatment && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Treatment:</p>
                                  <p className="text-sm text-slate-900 leading-relaxed">{visit.treatment}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "notes" && (
                  <div className="space-y-4">
                    {notes.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileText className="h-8 w-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium mb-2">No notes yet</p>
                        <p className="text-sm text-slate-400">Add notes using the sidebar</p>
                      </div>
                    ) : (
                      notes.map((note) => (
                        <div
                          key={note.id}
                          className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all"
                        >
                          {/* Note Header */}
                          <div
                            className="bg-slate-50 p-4 flex items-center justify-between cursor-pointer"
                            onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                                <FileText className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{note.title}</p>
                                <p className="text-xs text-slate-500">Click to view note</p>
                              </div>
                            </div>
                            {expandedNote === note.id ? (
                              <ChevronUp className="h-5 w-5 text-slate-400" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-slate-400" />
                            )}
                          </div>

                          {/* Expanded Note Details */}
                          {expandedNote === note.id && (
                            <div className="p-6 bg-white">
                              <div className="flex items-start justify-between mb-4">
                                <h4 className="font-bold text-lg text-slate-900">{note.title}</h4>
                                <p className="text-sm text-slate-500">
                                  {new Date(note.createdAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-sm text-slate-900 leading-relaxed whitespace-pre-wrap">
                                  {note.content}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Visit Dialog */}
      <NewVisitDialog
        open={showNewVisitDialog}
        petId={pet.id}
        onClose={() => setShowNewVisitDialog(false)}
        onSuccess={() => {
          setShowNewVisitDialog(false);
          fetchPetDetails(pet.id);
        }}
      />

      {/* Save Note Dialog */}
      <SaveNoteDialog
        open={showSaveNoteDialog}
        noteContent={newNote}
        onClose={() => setShowSaveNoteDialog(false)}
        onSave={handleSaveNote}
      />

      {/* Edit Pet Dialog */}
      {pet && (
        <EditPetDialog
          open={showEditPetDialog}
          pet={pet}
          onClose={() => setShowEditPetDialog(false)}
          onSuccess={() => {
            setShowEditPetDialog(false);
            fetchPetDetails(pet.id);
          }}
        />
      )}

      {/* Edit Visit Dialog */}
      {editingVisit && (
        <EditVisitDialog
          open={showEditVisitDialog}
          visit={editingVisit}
          onClose={() => {
            setShowEditVisitDialog(false);
            setEditingVisit(null);
          }}
          onSuccess={() => {
            setShowEditVisitDialog(false);
            setEditingVisit(null);
            if (pet) fetchPetDetails(pet.id);
          }}
        />
      )}
    </div>
  );
}