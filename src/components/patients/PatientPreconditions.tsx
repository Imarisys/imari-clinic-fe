import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { ConfirmationDialog } from '../common/ConfirmationDialog';
import { PreconditionService, Precondition } from '../../services/preconditionService';
import { useNotification } from '../../hooks/useNotification';
import { useTranslation } from '../../context/TranslationContext';

interface PatientPreconditionsProps {
  patientId: string;
  isEditable?: boolean;
}

export const PatientPreconditions: React.FC<PatientPreconditionsProps> = ({
  patientId,
  isEditable = true
}) => {
  const { t } = useTranslation();
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
    { name: t('diabetes_type_1'), icon: '🩸' },
    { name: t('diabetes_type_2'), icon: '🩸' },
    { name: t('hypertension'), icon: '💓' },
    { name: t('heart_disease'), icon: '❤️' },
    { name: t('asthma'), icon: '🫁' },
    { name: t('copd'), icon: '🫁' },
    { name: t('allergies'), icon: '🤧' },
    { name: t('arthritis'), icon: '🦴' },
    { name: t('depression'), icon: '🧠' },
    { name: t('anxiety'), icon: '😰' },
    { name: t('kidney_disease'), icon: '🫘' },
    { name: t('liver_disease'), icon: '🫖' },
    { name: t('thyroid_disease'), icon: '🦋' },
    { name: t('osteoporosis'), icon: '🦴' },
    { name: t('high_cholesterol'), icon: '🧈' },
    { name: t('migraine'), icon: '🤕' },
    { name: t('epilepsy'), icon: '⚡' },
    { name: t('cancer_history'), icon: '🎗️' },
    { name: t('blood_clotting_disorder'), icon: '🩸' },
    { name: t('autoimmune_disease'), icon: '🛡️' }
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
      showNotification('error', t('error'), t('failed_to_load_medical_preconditions'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPrecondition = async () => {
    const namesToAdd = selectedPreconditions.length > 0
      ? selectedPreconditions
      : customCondition.trim() ? [customCondition.trim()] : [];

    if (namesToAdd.length === 0) {
      showNotification('warning', t('warning'), t('please_select_or_enter_condition_name'));
      return;
    }

    setIsUpdating(true);
    try {
      const batch = namesToAdd.map(name => ({
        patient_id: patientId,
        name,
        date: selectedDate,
        note: notes.trim() || undefined,
      }));

      const created = await PreconditionService.createBatch(batch);
      setPreconditions(prev => [...prev, ...created]);
      setSelectedPreconditions([]);
      setCustomCondition('');
      setNotes('');
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setShowAddModal(false);
      showNotification('success', t('success'), `${created.length} condition(s) ajoutée(s)`);
    } catch (error) {
      console.error('Failed to add preconditions:', error);
      showNotification('error', t('error'), t('failed_to_add_medical_condition'));
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

      showNotification('success', t('success'), t('medical_condition_updated_successfully'));
    } catch (error) {
      console.error('Failed to update precondition:', error);
      showNotification('error', t('error'), t('failed_to_update_medical_condition'));
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

      showNotification('success', t('success'), t('medical_condition_deleted_successfully'));
    } catch (error) {
      console.error('Failed to delete precondition:', error);
      showNotification('error', t('error'), t('failed_to_delete_medical_condition'));
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
    setSelectedPreconditions(prev =>
      prev.includes(conditionName)
        ? prev.filter(c => c !== conditionName)
        : [...prev, conditionName]
    );
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
            {t('medical_preconditions')}
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
            {t('add_medical_precondition')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-2xl mb-2">⏳</div>
          <p className="text-sm">{t('loading_medical_preconditions')}</p>
        </div>
      ) : preconditions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-sm">
            {t('no_medical_preconditions_recorded')}
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
                  <Button
                    variant="secondary"
                    size="sm"
                    icon="edit"
                    onClick={() => openEditModal(precondition)}
                    disabled={isUpdating}
                    title={t('edit_precondition')}
                  >
                    {t('edit')}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon="delete"
                    onClick={() => confirmDelete(precondition.id)}
                    disabled={isUpdating}
                    title={t('delete_precondition')}
                  >
                    {t('delete')}
                  </Button>
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
        title={t('add_medical_preconditions')}
        size="lg"
      >
        <div className="space-y-6">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('date_diagnosed')}
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
              {t('precondition')}
            </label>
            <Input
              value={customCondition}
              onChange={(e) => setCustomCondition(e.target.value)}
              placeholder={t('enter_medical_condition_name')}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('select_from_suggestions_or_type_custom')}
            </p>
          </div>

          {/* Common Preconditions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('select_common_conditions')}
            </label>
            <div className="max-h-48 overflow-y-auto border rounded-lg p-3">
              <div className="space-y-1">
                {commonPreconditions.map((condition) => {
                  const isChecked = selectedPreconditions.includes(condition.name);
                  return (
                  <div
                    key={condition.name}
                    onClick={() => togglePrecondition(condition.name)}
                    className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-colors border ${
                      isChecked ? 'bg-blue-50 border-blue-300' : 'border-transparent hover:bg-blue-50 hover:border-blue-200'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition ${
                      isChecked ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                    }`}>
                      {isChecked && <span className="material-icons-round text-white text-sm">check</span>}
                    </div>
                    <span className="text-lg">{condition.icon}</span>
                    <span className="text-sm text-gray-700 font-medium">{condition.name}</span>
                  </div>
                  );
                })}
              </div>
            </div>
            {selectedPreconditions.length > 0 && (
              <p className="text-xs text-blue-600 mt-2 font-medium">
                {selectedPreconditions.length} condition(s) sélectionnée(s)
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('notes_optional')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('additional_notes_about_condition')}
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
              {t('cancel')}
            </Button>
            <Button
              onClick={handleAddPrecondition}
              disabled={isUpdating || (selectedPreconditions.length === 0 && !customCondition.trim())}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUpdating ? t('adding') : t('add_condition')}
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
        title={t('edit_medical_precondition')}
        size="md"
      >
        <div className="space-y-4">
          {/* Precondition Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('precondition')}
            </label>
            <Input
              value={customCondition}
              onChange={(e) => setCustomCondition(e.target.value)}
              placeholder={t('enter_medical_condition_name')}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('select_from_suggestions_or_type_custom')}
            </p>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('date_diagnosed')}
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
              {t('notes_optional')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('additional_notes_about_condition')}
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
              {t('cancel')}
            </Button>
            <Button
              onClick={handleEditPrecondition}
              disabled={isUpdating || !customCondition.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUpdating ? t('updating') : t('update_condition')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeletePrecondition}
        title={t('delete_medical_precondition')}
        message={t('delete_medical_precondition_confirmation')}
        confirmButtonText={t('delete')}
        cancelButtonText={t('cancel')}
        variant="danger"
        isLoading={isUpdating}
      />
    </div>
  );
};
