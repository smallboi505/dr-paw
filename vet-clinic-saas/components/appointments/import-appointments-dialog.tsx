"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Download, X, CheckCircle, AlertCircle } from "lucide-react";
import { parseCSV, downloadTemplate } from "@/lib/csv-import";

interface ImportAppointmentsDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CSVRow {
  petName?: string;
  ownerName?: string;
  date?: string;
  time?: string;
  reason?: string;
  status?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export default function ImportAppointmentsDialog({ open, onClose, onSuccess }: ImportAppointmentsDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<CSVRow[]>([]);
  const [validRows, setValidRows] = useState<CSVRow[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editedData, setEditedData] = useState<CSVRow>({});

  const handleDownloadTemplate = () => {
    const headers = [
      'petName',
      'ownerName',
      'date',
      'time',
      'reason',
      'status',
    ];

    const example = [
      'Bello',
      'Uncle Sam',
      '2026-02-15',
      '10:00',
      'Vaccination',
      'SCHEDULED',
    ];

    downloadTemplate(headers, 'appointments-import-template.csv', example);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const isRequired = (value: any) => {
    return value !== undefined && value !== null && value.toString().trim() !== '';
  };

  const isValidDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  };

  const isValidTime = (timeStr: string) => {
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr);
  };

  const parseFile = async (file: File) => {
    setPreviewing(true);
    
    const text = await file.text();
    const { headers, rows } = parseCSV(text);

    // Validate rows
    const validationErrors: ValidationError[] = [];
    const valid: CSVRow[] = [];

    rows.forEach((row, index) => {
      const rowErrors: string[] = [];

      // Required fields
      if (!isRequired(row.petName)) rowErrors.push('petName');
      if (!isRequired(row.ownerName)) rowErrors.push('ownerName');
      if (!isRequired(row.date)) rowErrors.push('date');
      if (!isRequired(row.time)) rowErrors.push('time');
      if (!isRequired(row.reason)) rowErrors.push('reason');

      // Date validation
      if (row.date && !isValidDate(row.date)) {
        validationErrors.push({
          row: index + 2,
          field: 'date',
          message: 'Invalid date format (use YYYY-MM-DD)',
        });
      }

      // Time validation
      if (row.time && !isValidTime(row.time)) {
        validationErrors.push({
          row: index + 2,
          field: 'time',
          message: 'Invalid time format (use HH:MM)',
        });
      }

      // Status validation
      const validStatuses = ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
      if (row.status && !validStatuses.includes(row.status.toUpperCase())) {
        validationErrors.push({
          row: index + 2,
          field: 'status',
          message: `Invalid status (must be one of: ${validStatuses.join(', ')})`,
        });
      }

      // Add required field errors
      rowErrors.forEach(field => {
        validationErrors.push({
          row: index + 2,
          field,
          message: 'Required field is missing',
        });
      });

      // If no errors, add to valid rows
      if (rowErrors.length === 0) {
        valid.push(row);
      }
    });

    setPreviewData(rows.slice(0, 10));
    setValidRows(valid);
    setErrors(validationErrors);
    setPreviewing(false);
  };

  const handleEditRow = (index: number) => {
    setEditingRow(index);
    setEditedData({ ...previewData[index] });
  };

  const handleSaveEdit = () => {
    if (editingRow === null) return;

    const updatedPreview = [...previewData];
    updatedPreview[editingRow] = editedData;
    setPreviewData(updatedPreview);

    // Re-validate
    const validationErrors: ValidationError[] = [];
    const valid: CSVRow[] = [];

    updatedPreview.forEach((row, index) => {
      const rowErrors: string[] = [];

      if (!isRequired(row.petName)) rowErrors.push('petName');
      if (!isRequired(row.ownerName)) rowErrors.push('ownerName');
      if (!isRequired(row.date)) rowErrors.push('date');
      if (!isRequired(row.time)) rowErrors.push('time');
      if (!isRequired(row.reason)) rowErrors.push('reason');

      if (row.date && !isValidDate(row.date)) {
        validationErrors.push({
          row: index + 2,
          field: 'date',
          message: 'Invalid date format',
        });
      }

      if (row.time && !isValidTime(row.time)) {
        validationErrors.push({
          row: index + 2,
          field: 'time',
          message: 'Invalid time format',
        });
      }

      rowErrors.forEach(field => {
        validationErrors.push({
          row: index + 2,
          field,
          message: 'Required field is missing',
        });
      });

      if (rowErrors.length === 0) {
        valid.push(row);
      }
    });

    setValidRows(valid);
    setErrors(validationErrors);
    setEditingRow(null);
    setEditedData({});
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditedData({});
  };

  const handleImport = async () => {
    if (validRows.length === 0) {
      alert("No valid rows to import");
      return;
    }

    setImporting(true);

    try {
      const response = await fetch("/api/appointments/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ appointments: validRows }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully imported ${result.imported} appointment${result.imported !== 1 ? 's' : ''}!`);
        onSuccess();
        handleClose();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to import appointments");
      }
    } catch (error) {
      console.error("Import error:", error);
      alert("Failed to import appointments");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData([]);
    setValidRows([]);
    setErrors([]);
    setEditingRow(null);
    setEditedData({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Appointments from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 px-6 pb-6">
          {/* Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Download className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Need a template?</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Download our CSV template with an example row to get started.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="border-blue-600 text-blue-600 hover:bg-blue-100"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </div>
          </div>

          {/* File Upload */}
          {!file ? (
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:border-[#C00000] transition-colors">
              <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Upload CSV File
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Select a CSV file with appointment data to import
              </p>
              <input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Button className="bg-[#C00000] hover:bg-[#A00000]" type="button" onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('file-upload')?.click();
                }}>
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </label>
            </div>
          ) : (
            <>
              {/* File Info */}
              <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-slate-900">{file.name}</p>
                    <p className="text-sm text-slate-600">
                      {validRows.length} valid rows, {errors.length} errors
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  <X className="h-4 w-4" />
                  Remove
                </Button>
              </div>

              {/* Validation Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">Valid Rows</h3>
                  </div>
                  <p className="text-3xl font-bold text-green-700">{validRows.length}</p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h3 className="font-semibold text-red-900">Errors</h3>
                  </div>
                  <p className="text-3xl font-bold text-red-700">{errors.length}</p>
                </div>
              </div>

              {/* Errors List */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-3">Validation Errors</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {errors.map((error, i) => (
                      <p key={i} className="text-sm text-red-700">
                        <span className="font-semibold">Row {error.row}:</span> {error.field} - {error.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Preview (first 10 rows) - Click row to edit</h3>
                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-pink-100">
                      <tr>
                        <th className="text-left py-2 px-3 text-slate-900">Row</th>
                        <th className="text-left py-2 px-3 text-slate-900">Pet Name</th>
                        <th className="text-left py-2 px-3 text-slate-900">Owner Name</th>
                        <th className="text-left py-2 px-3 text-slate-900">Date</th>
                        <th className="text-left py-2 px-3 text-slate-900">Time</th>
                        <th className="text-left py-2 px-3 text-slate-900">Reason</th>
                        <th className="text-left py-2 px-3 text-slate-900">Status</th>
                        <th className="text-left py-2 px-3 text-slate-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, i) => {
                        const hasError = errors.some(e => e.row === i + 2);
                        const isEditing = editingRow === i;
                        
                        return (
                          <tr 
                            key={i} 
                            className={`border-b border-slate-100 ${hasError ? 'bg-red-50' : 'hover:bg-slate-50'} ${isEditing ? 'bg-blue-50' : ''}`}
                          >
                            <td className="py-2 px-3 font-semibold text-slate-900">{i + 2}</td>
                            <td className="py-2 px-3 text-slate-900">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editedData.petName || ''}
                                  onChange={(e) => setEditedData({ ...editedData, petName: e.target.value })}
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-slate-900"
                                  placeholder="Bello"
                                />
                              ) : (
                                row.petName
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-900">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editedData.ownerName || ''}
                                  onChange={(e) => setEditedData({ ...editedData, ownerName: e.target.value })}
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-slate-900"
                                  placeholder="Uncle Sam"
                                />
                              ) : (
                                row.ownerName
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-900">
                              {isEditing ? (
                                <input
                                  type="date"
                                  value={editedData.date || ''}
                                  onChange={(e) => setEditedData({ ...editedData, date: e.target.value })}
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-slate-900"
                                />
                              ) : (
                                row.date
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-900">
                              {isEditing ? (
                                <input
                                  type="time"
                                  value={editedData.time || ''}
                                  onChange={(e) => setEditedData({ ...editedData, time: e.target.value })}
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-slate-900"
                                />
                              ) : (
                                row.time
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-900">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editedData.reason || ''}
                                  onChange={(e) => setEditedData({ ...editedData, reason: e.target.value })}
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-slate-900"
                                />
                              ) : (
                                row.reason
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-900">
                              {isEditing ? (
                                <select
                                  value={editedData.status || ''}
                                  onChange={(e) => setEditedData({ ...editedData, status: e.target.value })}
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-slate-900"
                                >
                                  <option value="">Select</option>
                                  <option value="SCHEDULED">Scheduled</option>
                                  <option value="CONFIRMED">Confirmed</option>
                                  <option value="COMPLETED">Completed</option>
                                  <option value="CANCELLED">Cancelled</option>
                                  <option value="NO_SHOW">No Show</option>
                                </select>
                              ) : (
                                row.status
                              )}
                            </td>
                            <td className="py-2 px-3">
                              {isEditing ? (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    onClick={handleSaveEdit}
                                    className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-xs"
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    className="px-2 py-1 text-xs"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditRow(i)}
                                  className="px-2 py-1 text-xs"
                                >
                                  Edit
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Import Button */}
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={validRows.length === 0 || importing}
                  className="bg-[#C00000] hover:bg-[#A00000]"
                >
                  {importing ? "Importing..." : `Import ${validRows.length} Appointment${validRows.length !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}