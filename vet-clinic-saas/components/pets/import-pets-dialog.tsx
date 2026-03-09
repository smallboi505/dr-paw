"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Download, X, AlertCircle, CheckCircle, AlertTriangle, SkipForward } from "lucide-react";
import { parseCSV, downloadTemplate, isValidEmail, isValidPhone, type CSVRow } from "@/lib/csv-import";

interface RowStatus {
  row: CSVRow;
  issues: string[];
  severity: "ok" | "warning" | "error";
  skipped: boolean;
}

interface ImportPetsDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportPetsDialog({ open, onClose, onSuccess }: ImportPetsDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [rowStatuses, setRowStatuses] = useState<RowStatus[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedData, setEditedData] = useState<CSVRow>({});

  const analyzeRows = (rows: CSVRow[]): RowStatus[] => {
    return rows.map((row) => {
      const issues: string[] = [];
      let severity: "ok" | "warning" | "error" = "ok";

      // Errors - things that will definitely fail
      if (!row.name || row.name === "NaN") issues.push("Missing pet name");
      if (!row.species) issues.push("Missing species");
      if (!row.ownerName) issues.push("Missing owner name");
      if (!row.id) issues.push("Missing ID — will be skipped in manual mode");

      // Warnings - things that are optional but worth noting
      if (!row.ownerPhone) issues.push("No phone number");
      if (!row.sex) issues.push("No sex recorded");
      if (row.ownerPhone && !isValidPhone(row.ownerPhone)) issues.push("Phone format looks unusual");
      if (row.ownerEmail && !isValidEmail(row.ownerEmail)) issues.push("Email format invalid");

      const validSpecies = ["Dog", "Cat", "Bird", "Rabbit", "Other"];
      if (row.species && !validSpecies.includes(row.species)) issues.push(`Unknown species: "${row.species}"`);

      if (issues.some(i => i.includes("Missing pet name") || i.includes("Missing species") || i.includes("Missing owner name"))) {
        severity = "error";
      } else if (issues.length > 0) {
        severity = "warning";
      }

      return { row, issues, severity, skipped: false };
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || selectedFile.type !== "text/csv") {
      alert("Please select a valid CSV file");
      return;
    }
    setFile(selectedFile);
    const text = await selectedFile.text();
    const { rows } = parseCSV(text);
    setRowStatuses(analyzeRows(rows));
  };

  const handleToggleSkip = (index: number) => {
    setRowStatuses(prev =>
      prev.map((s, i) => i === index ? { ...s, skipped: !s.skipped } : s)
    );
  };

  const handleEditRow = (index: number) => {
    setEditingIndex(index);
    setEditedData({ ...rowStatuses[index].row });
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    setRowStatuses(prev =>
      prev.map((s, i) => {
        if (i !== editingIndex) return s;
        const updated = analyzeRows([editedData])[0];
        return { ...updated, skipped: s.skipped };
      })
    );
    setEditingIndex(null);
    setEditedData({});
  };

  const handleImport = async () => {
    const toImport = rowStatuses.filter(s => !s.skipped && s.severity !== "error");
    if (toImport.length === 0) {
      alert("No rows to import");
      return;
    }

    setImporting(true);
    try {
      const response = await fetch("/api/pets/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pets: toImport.map(s => s.row) }),
      });

      const result = await response.json();

      if (response.ok) {
        let message = `Successfully imported ${result.imported} pets!`;
        if (result.errors && result.errors.length > 0) {
          message += `\n\nSkipped ${result.errors.length}:\n${result.errors.slice(0, 5).join("\n")}`;
          if (result.errors.length > 5) message += `\n...and ${result.errors.length - 5} more`;
        }
        alert(message);
        onSuccess();
        handleClose();
      } else {
        alert(`Import failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Import error:", error);
      alert("Failed to import pets");
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ["id", "name", "species", "breed", "sex", "color", "ownerName", "ownerPhone", "ownerEmail", "ownerAddress"];
    const example = ["MS/VC/0001", "Buddy", "Dog", "Golden Retriever", "M", "Golden", "John Doe", "0201234567", "john@example.com", "Accra, Ghana"];
    downloadTemplate(headers, "pets-import-template.csv", example);
  };

  const handleClose = () => {
    setFile(null);
    setRowStatuses([]);
    setEditingIndex(null);
    setEditedData({});
    onClose();
  };

  const okCount = rowStatuses.filter(s => !s.skipped && s.severity === "ok").length;
  const warnCount = rowStatuses.filter(s => !s.skipped && s.severity === "warning").length;
  const errorCount = rowStatuses.filter(s => s.severity === "error").length;
  const skippedCount = rowStatuses.filter(s => s.skipped).length;
  const toImportCount = rowStatuses.filter(s => !s.skipped && s.severity !== "error").length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Pets from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-4">
          {/* Template download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-blue-900 text-sm">Need a template?</p>
              <p className="text-xs text-blue-700">Download our CSV template to get started.</p>
            </div>
            <Button size="sm" variant="outline" onClick={handleDownloadTemplate} className="text-blue-600 border-blue-300">
              <Download className="h-4 w-4 mr-2" />Download Template
            </Button>
          </div>

          {/* File upload */}
          {!file ? (
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:border-[#C00000] transition-colors">
              <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Upload CSV File</h3>
              <p className="text-sm text-slate-600 mb-4">Select a CSV file with pet data to import</p>
              <input id="file-upload" type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
              <Button className="bg-[#C00000] hover:bg-[#A00000]" type="button" onClick={() => document.getElementById("file-upload")?.click()}>
                <Upload className="h-4 w-4 mr-2" />Choose File
              </Button>
            </div>
          ) : (
            <>
              {/* File info + summary */}
              <div className="flex items-center justify-between bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-slate-900">{file.name}</p>
                    <p className="text-sm text-slate-500">{rowStatuses.length} total rows loaded</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setFile(null)}>
                  <X className="h-4 w-4 mr-1" />Remove
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">{okCount}</p>
                  <p className="text-xs text-green-600 font-medium">Ready</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-700">{warnCount}</p>
                  <p className="text-xs text-yellow-600 font-medium">Warnings</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-700">{errorCount}</p>
                  <p className="text-xs text-red-600 font-medium">Errors</p>
                </div>
                <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-slate-600">{skippedCount}</p>
                  <p className="text-xs text-slate-500 font-medium">Skipped</p>
                </div>
              </div>

              {/* Row table */}
              <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-pink-100 sticky top-0">
                    <tr>
                      <th className="text-left py-2 px-3 text-slate-700">#</th>
                      <th className="text-left py-2 px-3 text-slate-700">Status</th>
                      <th className="text-left py-2 px-3 text-slate-700">Name</th>
                      <th className="text-left py-2 px-3 text-slate-700">ID</th>
                      <th className="text-left py-2 px-3 text-slate-700">Species</th>
                      <th className="text-left py-2 px-3 text-slate-700">Owner</th>
                      <th className="text-left py-2 px-3 text-slate-700">Issues</th>
                      <th className="text-left py-2 px-3 text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rowStatuses.map((status, i) => {
                      const isEditing = editingIndex === i;
                      const rowBg = status.skipped
                        ? "bg-slate-100 opacity-50"
                        : status.severity === "error"
                        ? "bg-red-50"
                        : status.severity === "warning"
                        ? "bg-yellow-50"
                        : "hover:bg-slate-50";

                      return (
                        <tr key={i} className={`border-b border-slate-100 ${rowBg}`}>
                          <td className="py-2 px-3 text-slate-500 text-xs">{i + 2}</td>
                          <td className="py-2 px-3">
                            {status.skipped ? (
                              <span className="text-slate-400 text-xs">Skipped</span>
                            ) : status.severity === "error" ? (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            ) : status.severity === "warning" ? (
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900">
                            {isEditing ? (
                              <input type="text" value={editedData.name || ""} onChange={e => setEditedData({ ...editedData, name: e.target.value })} className="w-full px-2 py-1 border border-slate-300 rounded text-slate-900 text-xs" />
                            ) : status.row.name || <span className="text-slate-400 italic">—</span>}
                          </td>
                          <td className="py-2 px-3 text-slate-600 text-xs font-mono">
                            {isEditing ? (
                              <input type="text" value={editedData.id || ""} onChange={e => setEditedData({ ...editedData, id: e.target.value })} className="w-full px-2 py-1 border border-slate-300 rounded text-slate-900 text-xs" />
                            ) : status.row.id || <span className="text-slate-400 italic">—</span>}
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            {isEditing ? (
                              <select value={editedData.species || ""} onChange={e => setEditedData({ ...editedData, species: e.target.value })} className="px-2 py-1 border border-slate-300 rounded text-slate-900 text-xs">
                                <option value="">Select</option>
                                {["Dog", "Cat", "Bird", "Rabbit", "Other"].map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            ) : status.row.species}
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            {isEditing ? (
                              <input type="text" value={editedData.ownerName || ""} onChange={e => setEditedData({ ...editedData, ownerName: e.target.value })} className="w-full px-2 py-1 border border-slate-300 rounded text-slate-900 text-xs" />
                            ) : status.row.ownerName || <span className="text-slate-400 italic">—</span>}
                          </td>
                          <td className="py-2 px-3">
                            {status.issues.length > 0 ? (
                              <ul className="text-xs space-y-0.5">
                                {status.issues.map((issue, j) => (
                                  <li key={j} className={status.severity === "error" ? "text-red-600" : "text-yellow-600"}>• {issue}</li>
                                ))}
                              </ul>
                            ) : <span className="text-green-600 text-xs">All good</span>}
                          </td>
                          <td className="py-2 px-3">
                            {isEditing ? (
                              <div className="flex gap-1">
                                <Button size="sm" onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-xs h-auto">Save</Button>
                                <Button size="sm" variant="outline" onClick={() => { setEditingIndex(null); setEditedData({}); }} className="px-2 py-1 text-xs h-auto">Cancel</Button>
                              </div>
                            ) : (
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" onClick={() => handleEditRow(i)} className="px-2 py-1 text-xs h-auto">Edit</Button>
                                <Button size="sm" variant="outline" onClick={() => handleToggleSkip(i)} className={`px-2 py-1 text-xs h-auto ${status.skipped ? "text-green-600" : "text-slate-500"}`}>
                                  {status.skipped ? "Undo" : "Skip"}
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">{toImportCount}</span> rows will be imported
                  {skippedCount > 0 && <span className="text-slate-400"> · {skippedCount} skipped</span>}
                  {errorCount > 0 && <span className="text-red-500"> · {errorCount} errors blocked</span>}
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleClose}>Cancel</Button>
                  <Button onClick={handleImport} disabled={importing || toImportCount === 0} className="bg-[#C00000] hover:bg-[#A00000]">
                    {importing ? "Importing..." : `Import ${toImportCount} Pets`}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}