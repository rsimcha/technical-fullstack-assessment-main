import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { maintenanceService } from '../services/maintenanceService';
import { userService } from '../services/userService';
import {
  CreateMaintenanceFormData,
  Manager,
  MaintenanceListFilters,
  MaintenanceListResponse,
  MaintenanceRequest,
  UpdateMaintenanceFormData,
} from '../types';
import MaintenanceTable from '../components/maintenance/MaintenanceTable';
import MaintenanceFilters from '../components/maintenance/MaintenanceFilters';
import MaintenancePageHeader from '../components/maintenance/MaintenancePageHeader';
import MaintenanceEmptyState from '../components/maintenance/MaintenanceEmptyState';
import MaintenancePagination from '../components/maintenance/MaintenancePagination';
import CreateMaintenanceForm from '../components/maintenance/CreateMaintenanceForm';
import EditMaintenanceForm from '../components/maintenance/EditMaintenanceForm';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

type ModalState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; request: MaintenanceRequest };

const PAGE_LIMIT = 10;

const MaintenancePage: React.FC = () => {
  const { user } = useAuth();
  const canManage = user?.role === 'manager' || user?.role === 'admin';
  const canCreate = user?.role === 'tenant';

  const [filters, setFilters] = useState<MaintenanceListFilters>({
    page: 1,
    limit: PAGE_LIMIT,
  });
  const [data, setData] = useState<MaintenanceListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' });
  const [submitting, setSubmitting] = useState(false);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [pendingDelete, setPendingDelete] = useState<MaintenanceRequest | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await maintenanceService.list(filters);
      setData(result);
    } catch (err) {
      toast.error((err as Error).message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    let cancelled = false;
    userService
      .listByRole('manager')
      .then(({ users }) => {
        if (!cancelled) {setManagers(users);}
      })
      .catch((err: Error) => {
        if (!cancelled) {toast.error(err.message || 'Failed to load managers');}
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const closeModal = () => setModal({ mode: 'closed' });

  const updateFilters = (patch: Partial<MaintenanceListFilters>) => {
    setFilters(prev => ({ ...prev, ...patch, page: 1 }));
  };

  const goToPage = (nextPage: number) => {
    setFilters(prev => ({ ...prev, page: nextPage }));
  };

  const handleCreate = async (input: CreateMaintenanceFormData) => {
    setSubmitting(true);
    try {
      await maintenanceService.create(input);
      toast.success('Maintenance request created');
      closeModal();
      await fetchList();
    } catch (err) {
      toast.error((err as Error).message || 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (
    id: string,
    patch: UpdateMaintenanceFormData
  ) => {
    setSubmitting(true);
    try {
      await maintenanceService.update(id, patch);
      toast.success('Maintenance request updated');
      closeModal();
      await fetchList();
    } catch (err) {
      toast.error((err as Error).message || 'Failed to update request');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) {return;}
    setDeleting(true);
    try {
      await maintenanceService.remove(pendingDelete._id);
      toast.success('Maintenance request deleted');
      setPendingDelete(null);
      await fetchList();
    } catch (err) {
      toast.error((err as Error).message || 'Failed to delete request');
    } finally {
      setDeleting(false);
    }
  };

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const hasFilters = !!(filters.status || filters.priority || filters.assignedTo);
  const openCreate = () => setModal({ mode: 'create' });

  return (
    <div className="space-y-4">
      <MaintenancePageHeader
        canManage={canManage}
        canCreate={canCreate}
        onCreate={openCreate}
      />

      <div className="card p-4">
        <MaintenanceFilters
          filters={filters}
          managers={managers}
          onChange={updateFilters}
          canFilterByAssignee={canManage}
        />
      </div>

      {loading ? (
        <div className="card p-6 text-sm text-gray-500">Loading…</div>
      ) : items.length === 0 ? (
        <MaintenanceEmptyState
          hasFilters={hasFilters}
          canCreate={canCreate}
          onCreate={openCreate}
        />
      ) : (
        <>
          <MaintenanceTable
            items={items}
            canManage={canManage}
            onEdit={request => setModal({ mode: 'edit', request })}
            onDelete={request => setPendingDelete(request)}
          />
          {pagination && (
            <MaintenancePagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onChange={goToPage}
            />
          )}
        </>
      )}

      {modal.mode === 'create' && (
        <Modal title="New maintenance request" onClose={closeModal}>
          <CreateMaintenanceForm
            onSubmit={handleCreate}
            onCancel={closeModal}
            submitting={submitting}
          />
        </Modal>
      )}

      {modal.mode === 'edit' && (
        <Modal title="Edit request" onClose={closeModal}>
          <EditMaintenanceForm
            request={modal.request}
            managers={managers}
            onSubmit={patch => handleUpdate(modal.request._id, patch)}
            onCancel={closeModal}
            submitting={submitting}
          />
        </Modal>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete maintenance request"
          message={`Delete "${pendingDelete.title}"? This cannot be undone.`}
          confirmLabel="Delete"
          destructive
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => (deleting ? undefined : setPendingDelete(null))}
        />
      )}
    </div>
  );
};

export default MaintenancePage;
