"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Download, X, AlertCircle, CheckCircle } from "lucide-react";
import { parseCSV, downloadTemplate, isRequired, isValidEmail, isValidPhone, type CSVRow, type ValidationError } from "@/lib/csv-import";

interface ImportPetsDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportPetsDialog({ open, onClose, onSuccess }: ImportPetsDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<CSVRow[]>([]);
  const [validRows, setValidRows] = useState<CSVRow[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editedData, setEditedData] = useState<CSVRow>({});

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      parseFile(selectedFile);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const parseFile = async (file: File) => {
    setPreviewing(true);
    
    const text = await file.text();
    const { headers, rows } = parseCSV(text);

    // Validate rows (no normalization - preserve exact values)
    const validationErrors: ValidationError[] = [];
    const valid: CSVRow[] = [];

    rows.forEach((row, index) => {
      const rowErrors: string[] = [];

      // Required fields
      if (!isRequired(row.name)) rowErrors.push('name');
      if (!isRequired(row.species)) rowErrors.push('species');
      if (!isRequired(row.sex)) rowErrors.push('sex');
      if (!isRequired(row.ownerName)) rowErrors.push('ownerName');
      if (!isRequired(row.ownerPhone)) rowErrors.push('ownerPhone');

      // Phone validation
      if (row.ownerPhone && !isValidPhone(row.ownerPhone)) {
        validationErrors.push({
          row: index + 2, // +2 because index 0 is row 2 (after header)
          field: 'ownerPhone',
          message: 'Invalid phone format (must be 10 digits starting with 0)',
        });
      }

      // Email validation (if provided)
      if (row.ownerEmail && !isValidEmail(row.ownerEmail)) {
        validationErrors.push({
          row: index + 2,
          field: 'ownerEmail',
          message: 'Invalid email format',
        });
      }

      // Species validation
      const validSpecies = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Other'];
      if (row.species && !validSpecies.includes(row.species)) {
        validationErrors.push({
          row: index + 2,
          field: 'species',
          message: `Invalid species (must be one of: ${validSpecies.join(', ')})`,
        });
      }

      // Sex validation - accept M, Male, F, Female (preserve exact value)
      const validSexValues = ['M', 'Male', 'F', 'Female', 'm', 'male', 'f', 'female'];
      if (row.sex && !validSexValues.includes(row.sex)) {
        validationErrors.push({
          row: index + 2,
          field: 'sex',
          message: 'Invalid sex (must be M, Male, F, or Female)',
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

    setPreviewData(rows.slice(0, 10)); // Show first 10 rows
    setValidRows(valid);
    setErrors(validationErrors);
    setPreviewing(false);
  };

  const handleImport = async () => {
    if (validRows.length === 0) {
      alert('No valid rows to import');
      return;
    }

    setImporting(true);

    try {
      const response = await fetch('/api/pets/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pets: validRows }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Successfully imported ${result.imported} pets!`);
        onSuccess();
        handleClose();
      } else {
        alert(`Import failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import pets');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'id',
      'name',
      'species',
      'breed',
      'sex',
      'color',
      'ownerName',
      'ownerPhone',
      'ownerEmail',
      'ownerAddress',
    ];

    const example = [
      'MS/VC/0001',
      'Buddy',
      'Dog',
      'Golden Retriever',
      'M',
      'Golden',
      'John Doe',
      '0201234567',
      'john@example.com',
      'Accra, Ghana',
    ];

    downloadTemplate(headers, 'pets-import-template.csv', example);
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

  const handleEditRow = (index: number) => {
    setEditingRow(index);
    setEditedData({ ...previewData[index] });
  };

  const handleSaveEdit = () => {
    if (editingRow === null) return;

    // Update the row (no normalization - preserve exact value)
    const updatedPreview = [...previewData];
    updatedPreview[editingRow] = editedData;
    setPreviewData(updatedPreview);

    // Re-validate all rows
    const validationErrors: ValidationError[] = [];
    const valid: CSVRow[] = [];

    updatedPreview.forEach((row, index) => {
      const rowErrors: string[] = [];

      if (!isRequired(row.name)) rowErrors.push('name');
      if (!isRequired(row.species)) rowErrors.push('species');
      if (!isRequired(row.sex)) rowErrors.push('sex');
      if (!isRequired(row.ownerName)) rowErrors.push('ownerName');
      if (!isRequired(row.ownerPhone)) rowErrors.push('ownerPhone');

      if (row.ownerPhone && !isValidPhone(row.ownerPhone)) {
        validationErrors.push({
          row: index + 2,
          field: 'ownerPhone',
          message: 'Invalid phone format',
        });
      }

      const validSexValues = ['M', 'Male', 'F', 'Female', 'm', 'male', 'f', 'female'];
      if (row.sex && !validSexValues.includes(row.sex)) {
        validationErrors.push({
          row: index + 2,
          field: 'sex',
          message: 'Invalid sex (must be M, Male, F, or Female)',
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Pets from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-6">
          {/* Download Template */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Download className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Need a template?</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Download our CSV template with an example row to get started.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  className="text-blue-600 border-blue-300 hover:bg-blue-100"
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
                Select a CSV file with pet data to import
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
              <div className="flex items-center justify-between bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{file.name}</p>
                    <p className="text-sm text-slate-600">
                      {validRows.length} valid rows, {errors.length} errors
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>

              {/* Validation Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-900">Valid Rows</span>
                  </div>
                  <p className="text-3xl font-bold text-green-700">{validRows.length}</p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-900">Errors</span>
                  </div>
                  <p className="text-3xl font-bold text-red-700">{errors.length}</p>
                </div>
              </div>

              {/* Errors List */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <h3 className="font-semibold text-red-900 mb-3">Validation Errors</h3>
                  <div className="space-y-2">
                    {errors.slice(0, 10).map((error, i) => (
                      <div key={i} className="text-sm text-red-700">
                        <span className="font-semibold">Row {error.row}:</span> {error.field} - {error.message}
                      </div>
                    ))}
                    {errors.length > 10 && (
                      <p className="text-sm text-red-600 italic">
                        ...and {errors.length - 10} more errors
                      </p>
                    )}
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
                        <th className="text-left py-2 px-3 text-slate-900">Name</th>
                        <th className="text-left py-2 px-3 text-slate-900">Species</th>
                        <th className="text-left py-2 px-3 text-slate-900">Sex</th>
                        <th className="text-left py-2 px-3 text-slate-900">Owner</th>
                        <th className="text-left py-2 px-3 text-slate-900">Phone</th>
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
                                  value={editedData.name || ''}
                                  onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-slate-900"
                                />
                              ) : (
                                row.name
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-900">
                              {isEditing ? (
                                <select
                                  value={editedData.species || ''}
                                  onChange={(e) => setEditedData({ ...editedData, species: e.target.value })}
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-slate-900"
                                >
                                  <option value="">Select</option>
                                  <option value="Dog">Dog</option>
                                  <option value="Cat">Cat</option>
                                  <option value="Bird">Bird</option>
                                  <option value="Rabbit">Rabbit</option>
                                  <option value="Other">Other</option>
                                </select>
                              ) : (
                                row.species
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-900">
                              {isEditing ? (
                                <select
                                  value={editedData.sex || ''}
                                  onChange={(e) => setEditedData({ ...editedData, sex: e.target.value })}
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-slate-900"
                                >
                                  <option value="">Select</option>
                                  <option value="M">M</option>
                                  <option value="Male">Male</option>
                                  <option value="F">F</option>
                                  <option value="Female">Female</option>
                                </select>
                              ) : (
                                row.sex
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-900">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editedData.ownerName || ''}
                                  onChange={(e) => setEditedData({ ...editedData, ownerName: e.target.value })}
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-slate-900"
                                />
                              ) : (
                                row.ownerName
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-900">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editedData.ownerPhone || ''}
                                  onChange={(e) => setEditedData({ ...editedData, ownerPhone: e.target.value })}
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-slate-900"
                                  placeholder="0201234567"
                                />
                              ) : (
                                row.ownerPhone
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

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importing || validRows.length === 0}
                  className="bg-[#C00000] hover:bg-[#A00000]"
                >
                  {importing ? 'Importing...' : `Import ${validRows.length} Pets`}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}