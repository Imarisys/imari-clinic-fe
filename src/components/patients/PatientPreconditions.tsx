import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { ConfirmationDialog } from '../common/ConfirmationDialog';
import { PreconditionService, Precondition } from '../../services/preconditionService';
import { useNotification } from '../../hooks/useNotification';

interface PatientPreconditionsProps {
  patientId: string;
  isEditable?: boolean;
}

export const PatientPreconditions: React.FC<PatientPreconditionsProps> = ({
  patientId,
  isEditable = true
}) => {
  const [preconditions, setPreconditions] = useState<Precondition[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [preconditionToDelete, setPreconditionToDelete] = useState<string | null>(null);
  const [preconditionToEdit, setPreconditionToEdit] = useState<Precondition | null>(null);
  const [selectedPreconditions, setSelectedPreconditions] = useState<string[]>([]);
  const [customCondition, setCustomCondition] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { showNotification } = useNotification();

  // Predefined list of common medical preconditions with icons
  const commonPreconditions = [
    { name: 'Diabetes Type 1', icon: '🩸' },
    { name: 'Diabetes Type 2', icon: '🩸' },
    { name: 'Hypertension', icon: '💓' },
    { name: 'Heart Disease', icon: '❤️' },
    { name: 'Asthma', icon: '🫁' },
    { name: 'COPD', icon: '🫁' },
    { name: 'Allergies', icon: '🤧' },
    { name: 'Arthritis', icon: '🦴' },
    { name: 'Depression', icon: '🧠' },
    { name: 'Anxiety', icon: '😰' },
    { name: 'Kidney Disease', icon: '🫘' },
    { name: 'Liver Disease', icon: '🫖' },
    { name: 'Thyroid Disease', icon: '🦋' },
    { name: 'Osteoporosis', icon: '🦴' },
    { name: 'High Cholesterol', icon: '🧈' },
    { name: 'Migraine', icon: '🤕' },
    { name: 'Epilepsy', icon: '⚡' },
    { name: 'Cancer History', icon: '🎗️' },
    { name: 'Blood Clotting Disorder', icon: '🩸' },
    { name: 'Autoimmune Disease', icon: '🛡️' }
  ];

  // Load preconditions when component mounts or patientId changes
  useEffect(() => {
    if (patientId) {
      loadPreconditions();
    }
  }, [patientId]);

  const loadPreconditions = async () => {
    if (!patientId) return;

    setIsLoading(true);
    try {
      const response = await PreconditionService.getPatientPreconditions(patientId);
      setPreconditions(response.data);
    } catch (error) {
      console.error('Failed to load preconditions:', error);
      showNotification('error', 'Error', 'Failed to load medical preconditions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPrecondition = async () => {
    // Get the condition name - either from selected common condition or custom input
    const conditionName = selectedPreconditions.length > 0
      ? selectedPreconditions[0] // Take the first selected condition
      : customCondition.trim();

    if (!conditionName) {
      showNotification('warning', 'Warning', 'Please select or enter a condition name');
      return;
    }

    setIsUpdating(true);

    try {
      // Create single precondition via API
      const createdPrecondition = await PreconditionService.createPrecondition({
        patient_id: patientId,
        name: conditionName,
        date: selectedDate,
        note: notes.trim() || undefined
      });

      // Update local state
      setPreconditions(prev => [...prev, createdPrecondition]);

      // Reset form
      setSelectedPreconditions([]);
      setCustomCondition('');
      setNotes('');
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setShowAddModal(false);

      showNotification('success', 'Success', 'Medical condition added successfully');
    } catch (error) {
      console.error('Failed to add precondition:', error);
      showNotification('error', 'Error', 'Failed to add medical condition');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditPrecondition = async () => {
    if (!preconditionToEdit) return;

    setIsUpdating(true);
    try {
      const updated = await PreconditionService.updatePrecondition(preconditionToEdit.id, {
        name: customCondition || preconditionToEdit.name,
        date: selectedDate,
        note: notes.trim() || undefined
      });

      // Update local state
      setPreconditions(prev =>
        prev.map(p => p.id === preconditionToEdit.id ? updated : p)
      );

      // Reset form
      setCustomCondition('');
      setNotes('');
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setPreconditionToEdit(null);
      setShowEditModal(false);

      showNotification('success', 'Success', 'Medical condition updated successfully');
    } catch (error) {
      console.error('Failed to update precondition:', error);
      showNotification('error', 'Error', 'Failed to update medical condition');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePrecondition = async () => {
    if (!preconditionToDelete) return;

    setIsUpdating(true);
    try {
      await PreconditionService.deletePrecondition(preconditionToDelete);

      // Update local state
      setPreconditions(prev => prev.filter(p => p.id !== preconditionToDelete));

      setShowDeleteConfirm(false);
      setPreconditionToDelete(null);

      showNotification('success', 'Success', 'Medical condition deleted successfully');
    } catch (error) {
      console.error('Failed to delete precondition:', error);
      showNotification('error', 'Error', 'Failed to delete medical condition');
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDelete = (id: string) => {
    setPreconditionToDelete(id);
    setShowDeleteConfirm(true);
  };

  const openEditModal = (precondition: Precondition) => {
    setPreconditionToEdit(precondition);
    setCustomCondition(precondition.name);
    setNotes(precondition.note || '');
    setSelectedDate(precondition.date);
    setShowEditModal(true);
  };

  const togglePrecondition = (conditionName: string) => {
    // Set the custom condition field with the selected precondition name
    setCustomCondition(conditionName);
    // Clear any previous selections since we're using it as a picker now
    setSelectedPreconditions([]);
  };

  const resetAddForm = () => {
    setSelectedPreconditions([]);
    setCustomCondition('');
    setNotes('');
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const resetEditForm = () => {
    setCustomCondition('');
    setNotes('');
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setPreconditionToEdit(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Medical Preconditions
          </h3>
        </div>
        {isEditable && (
          <Button
            onClick={() => {
              resetAddForm();
              setShowAddModal(true);
            }}
            size="sm"
            disabled={isLoading || isUpdating}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <span className="text-white mr-1">+</span>
            Add Medical Precondition
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-2xl mb-2">⏳</div>
          <p className="text-sm">Loading medical preconditions...</p>
        </div>
      ) : preconditions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-sm">
            No medical preconditions recorded
          </p>
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto space-y-2">
          {preconditions.map((precondition) => (
            <div
              key={precondition.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    {precondition.name}
                  </span>
                  <span className="text-sm text-gray-500 font-medium">
                    {new Date(precondition.date).toLocaleDateString()}
                  </span>
                </div>
                {precondition.note && (
                  <p className="text-sm text-gray-600 mt-1">
                    {precondition.note}
                  </p>
                )}
              </div>
              {isEditable && (
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => openEditModal(precondition)}
                    disabled={isUpdating}
                    className="p-2 text-neutral-400 hover:text-blue-600 transition-colors duration-300 disabled:opacity-50"
                  >
                    <span className="material-icons-round text-lg">edit</span>
                  </button>
                  <button
                    onClick={() => confirmDelete(precondition.id)}
                    disabled={isUpdating}
                    className="p-2 text-neutral-400 hover:text-red-600 transition-colors duration-300 disabled:opacity-50"
                  >
                    <span className="material-icons-round text-lg">delete</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Precondition Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetAddForm();
        }}
        title="Add Medical Preconditions"
        size="lg"
      >
        <div className="space-y-6">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Diagnosed
            </label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Precondition Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precondition
            </label>
            <Input
              value={customCondition}
              onChange={(e) => setCustomCondition(e.target.value)}
              placeholder="Enter medical condition name..."
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Select from suggestions below or type a custom condition
            </p>
          </div>

          {/* Common Preconditions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Common Conditions
            </label>
            <div className="max-h-48 overflow-y-auto border rounded-lg p-3">
              <div className="space-y-1">
                {commonPreconditions.map((condition) => (
                  <div
                    key={condition.name}
                    onClick={() => togglePrecondition(condition.name)}
                    className="flex items-center space-x-3 cursor-pointer hover:bg-blue-50 p-3 rounded-lg transition-colors duration-200 border border-transparent hover:border-blue-200"
                  >
                    <span className="text-lg">{condition.icon}</span>
                    <span className="text-sm text-gray-700 font-medium">
                      {condition.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about the condition..."
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              onClick={() => {
                setShowAddModal(false);
                resetAddForm();
              }}
              variant="secondary"
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPrecondition}
              disabled={isUpdating || (selectedPreconditions.length === 0 && !customCondition.trim())}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUpdating ? 'Adding...' : 'Add Condition'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Precondition Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetEditForm();
        }}
        title="Edit Medical Precondition"
        size="md"
      >
        <div className="space-y-4">
          {/* Precondition Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precondition
            </label>
            <Input
              value={customCondition}
              onChange={(e) => setCustomCondition(e.target.value)}
              placeholder="Enter medical condition name..."
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Select from suggestions above or type a custom condition
            </p>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Diagnosed
            </label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about the condition..."
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              onClick={() => {
                setShowEditModal(false);
                resetEditForm();
              }}
              variant="secondary"
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditPrecondition}
              disabled={isUpdating || !customCondition.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUpdating ? 'Updating...' : 'Update Condition'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeletePrecondition}
        title="Delete Medical Precondition"
        message="Are you sure you want to delete this medical precondition? This action cannot be undone."
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        variant="danger"
        isLoading={isUpdating}
      />
    </div>
  );
};
