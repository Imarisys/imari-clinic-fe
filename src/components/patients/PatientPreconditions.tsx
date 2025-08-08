import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { ConfirmationDialog } from '../common/ConfirmationDialog';
import { PatientService } from '../../services/patientService';

interface Precondition {
  id: string;
  name: string;
  notes?: string;
  dateAdded: string;
}

interface PatientPreconditionsProps {
  preconditions: any;
  patientId?: string; // Add patientId prop for API calls
  onUpdate?: (preconditions: any) => Promise<void>;
  onChange?: (preconditions: any) => void; // For form usage
  isEditable?: boolean;
  isLoading?: boolean;
}

export const PatientPreconditions: React.FC<PatientPreconditionsProps> = ({
  preconditions,
  patientId,
  onUpdate,
  onChange,
  isEditable = true,
  isLoading = false
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [preconditionToDelete, setPreconditionToDelete] = useState<string | null>(null);
  const [selectedPreconditions, setSelectedPreconditions] = useState<string[]>([]);
  const [customCondition, setCustomCondition] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Today as default
  const [isUpdating, setIsUpdating] = useState(false);

  // Predefined list of common medical preconditions
  const commonPreconditions = [
    { name: 'Diabetes Type 1' },
    { name: 'Diabetes Type 2' },
    { name: 'Hypertension' },
    { name: 'Heart Disease' },
    { name: 'Asthma' },
    { name: 'COPD' },
    { name: 'Allergies' },
    { name: 'Arthritis' },
    { name: 'Depression' },
    { name: 'Anxiety' },
    { name: 'Kidney Disease' },
    { name: 'Liver Disease' },
    { name: 'Thyroid Disease' },
    { name: 'Osteoporosis' },
    { name: 'High Cholesterol' },
    { name: 'Migraine' },
    { name: 'Epilepsy' },
    { name: 'Cancer History' },
    { name: 'Blood Clotting Disorder' },
    { name: 'Autoimmune Disease' }
  ];

  // Parse preconditions from JSON if it's a string, or use as array if it's already parsed
  const parsedPreconditions: Precondition[] = React.useMemo(() => {
    if (!preconditions) return [];

    try {
      if (typeof preconditions === 'string') {
        const parsed = JSON.parse(preconditions);
        return Array.isArray(parsed) ? parsed : [];
      }
      if (Array.isArray(preconditions)) {
        return preconditions;
      }
      return [];
    } catch {
      return [];
    }
  }, [preconditions]);

  const handleAddPreconditions = async () => {
    const conditionsToAdd: string[] = [];

    // Add selected common preconditions
    conditionsToAdd.push(...selectedPreconditions);

    // Add custom condition if entered
    if (customCondition.trim()) {
      conditionsToAdd.push(customCondition.trim());
    }

    if (conditionsToAdd.length === 0) {
      return;
    }

    setIsUpdating(true);

    try {
      const newPreconditions: Precondition[] = conditionsToAdd.map(name => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name,
        notes: notes.trim() || undefined,
        dateAdded: selectedDate ? new Date(selectedDate).toISOString() : new Date().toISOString()
      }));

      const updatedPreconditions = [...parsedPreconditions, ...newPreconditions];

      // If patientId is provided, make API call
      if (patientId) {
        await PatientService.updatePatient(patientId, {
          preconditions: updatedPreconditions
        });
      }

      // Call parent update handlers
      if (onUpdate) {
        await onUpdate(updatedPreconditions);
      }
      if (onChange) {
        onChange(updatedPreconditions);
      }

      // Reset form
      setSelectedPreconditions([]);
      setCustomCondition('');
      setNotes('');
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to update patient preconditions:', error);
      throw error; // Re-throw to let parent components handle the error
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePrecondition = async (id: string) => {
    setIsUpdating(true);

    try {
      const updatedPreconditions = parsedPreconditions.filter(p => p.id !== id);

      // If patientId is provided, make API call
      if (patientId) {
        await PatientService.updatePatient(patientId, {
          preconditions: updatedPreconditions
        });
      }

      // Call parent update handlers
      if (onUpdate) {
        await onUpdate(updatedPreconditions);
      }
      if (onChange) {
        onChange(updatedPreconditions);
      }

      setShowDeleteConfirm(false);
      setPreconditionToDelete(null);
    } catch (error) {
      console.error('Failed to delete patient precondition:', error);
      throw error; // Re-throw to let parent components handle the error
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDelete = (id: string) => {
    setPreconditionToDelete(id);
    setShowDeleteConfirm(true);
  };

  const togglePrecondition = (conditionName: string) => {
    setSelectedPreconditions(prev =>
      prev.includes(conditionName)
        ? prev.filter(name => name !== conditionName)
        : [...prev, conditionName]
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🩺</span>
          <h3 className="text-lg font-semibold text-gray-900">
            Medical Preconditions
          </h3>
        </div>
        {isEditable && (
          <Button
            onClick={() => setShowAddModal(true)}
            size="sm"
            disabled={isLoading || isUpdating}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <span className="text-white mr-1">+</span>
            Add Medical Precondition
          </Button>
        )}
      </div>

      {parsedPreconditions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-sm">
            No medical preconditions recorded
          </p>
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto space-y-2">
          {parsedPreconditions.map((precondition) => (
            <div
              key={precondition.id}
              className="border rounded-lg p-3 transition-all duration-200 hover:shadow-sm bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">⚕️</span>
                    <h4 className="font-medium text-gray-900 text-sm">{precondition.name}</h4>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span>{new Date(precondition.dateAdded).toLocaleDateString()}</span>
                  </div>

                  {precondition.notes && (
                    <div className="mt-1 p-2 bg-white bg-opacity-70 rounded text-xs">
                      <span className="font-medium">Notes:</span> {precondition.notes}
                    </div>
                  )}
                </div>

                {isEditable && (
                  <button
                    onClick={() => confirmDelete(precondition.id)}
                    className="ml-2 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    disabled={isLoading}
                    title="Delete precondition"
                  >
                    <span className="material-icons-round text-base">delete</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Precondition Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedPreconditions([]);
          setCustomCondition('');
          setNotes('');
        }}
        title="Add Medical Preconditions"
        size="xl"
      >
        <div className="space-y-6">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-xl">➕</span>
            <h3 className="text-lg font-semibold">Add Medical Preconditions</h3>
            <div className="text-sm text-gray-500">
              (Select multiple conditions or add a custom one)
            </div>
          </div>

          {/* Show selected count */}
          {(selectedPreconditions.length > 0 || customCondition.trim()) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm font-medium text-blue-800">
                Selected conditions ({selectedPreconditions.length + (customCondition.trim() ? 1 : 0)}):
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedPreconditions.map((condition) => (
                  <span key={condition} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    ⚕️ {condition}
                    <button
                      onClick={() => togglePrecondition(condition)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {customCondition.trim() && (
                  <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    📝 {customCondition}
                    <button
                      onClick={() => setCustomCondition('')}
                      className="ml-1 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Custom Condition */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">Custom Condition</h4>

              <Input
                label="Condition Name"
                value={customCondition}
                onChange={(e) => setCustomCondition(e.target.value)}
                placeholder="Enter a custom condition..."
              />

              <Input
                label="Date Diagnosed"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (applies to all selected conditions)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional information..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Right Column - Common Preconditions */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">Common Preconditions</h4>

              <div className="max-h-80 overflow-y-auto border rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 gap-1 p-2">
                  {commonPreconditions.map((precondition, index) => {
                    const isSelected = selectedPreconditions.includes(precondition.name);
                    const existingCondition = parsedPreconditions.find(p => p.name === precondition.name);

                    return (
                      <button
                        key={index}
                        onClick={() => !existingCondition && togglePrecondition(precondition.name)}
                        disabled={!!existingCondition}
                        className={`
                          flex items-center justify-between p-3 rounded-lg transition-all duration-200 text-left
                          ${existingCondition 
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                            : isSelected 
                              ? 'bg-blue-100 border-2 border-blue-300 text-blue-800' 
                              : 'bg-white hover:bg-blue-50 border border-gray-200'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">⚕️</span>
                          <span className="text-sm font-medium">{precondition.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {existingCondition && (
                            <span className="text-xs text-gray-500">Already added</span>
                          )}
                          {isSelected && !existingCondition && (
                            <span className="text-blue-600 text-lg">✓</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {selectedPreconditions.length + (customCondition.trim() ? 1 : 0)} condition(s) selected
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedPreconditions([]);
                  setCustomCondition('');
                  setNotes('');
                }}
                variant="secondary"
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPreconditions}
                disabled={(selectedPreconditions.length === 0 && !customCondition.trim()) || isUpdating}
                loading={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isUpdating
                  ? 'Updating...'
                  : `Add ${selectedPreconditions.length + (customCondition.trim() ? 1 : 0)} Condition(s)`
                }
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onConfirm={() => preconditionToDelete && handleDeletePrecondition(preconditionToDelete)}
        onClose={() => {
          setShowDeleteConfirm(false);
          setPreconditionToDelete(null);
        }}
        title="Delete Precondition"
        message="Are you sure you want to delete this medical precondition? This action cannot be undone."
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        variant="danger"
      />
    </div>
  );
};
