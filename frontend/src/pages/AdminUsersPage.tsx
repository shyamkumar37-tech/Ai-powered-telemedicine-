import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import AdminLayout from "../components/AdminLayout";
import api from "../services/api";
import { getApiErrorMessage } from "../utils/apiError";
import { Users, Filter, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

export default function AdminUsersPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<DynamicStateObject[]>([]);
  const [loading, setLoading] = useState<DynamicState>(true);
  const [error, setError] = useState<DynamicState>("");
  const [roleFilter, setRoleFilter] = useState<DynamicState>("");
  const [statusFilter, setStatusFilter] = useState<DynamicState>("");
  const [showModal, setShowModal] = useState<DynamicState>(false);
  const [modalAction, setModalAction] = useState<DynamicStateObject | null>(null); 

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users", {
        params: {
          role: roleFilter || undefined,
          active: statusFilter ? statusFilter === "true" : undefined
        }
      });
      setUsers(res.data);
      setError("");
    } catch (err: DynamicStateObject) {
      setError(getApiErrorMessage(err, "Failed to load users"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const confirmAction = async () => {
    if (!modalAction) return;
    const { type, user } = modalAction;
    try {
      if (type === 'suspend') {
        await api.put(`/admin/users/${user.id}/suspend`);
        toast.success(`User ${user.fullName} suspended.`);
      } else if (type === 'reactivate') {
        await api.put(`/admin/users/${user.id}/reactivate`);
        toast.success(`User ${user.fullName} reactivated.`);
      } else if (type === 'reset') {
        const res = await api.put(`/admin/users/${user.id}/reset-password`);
        toast.success(res.data.message || `Password reset link sent to ${user.email}`);
      }
      fetchUsers();
    } catch (err: DynamicStateObject) {
      toast.error(getApiErrorMessage(err, "Action failed"));
    } finally {
      setShowModal(false);
    }
  };

  const openModal = (type: DynamicStateObject, user: DynamicStateObject) => {
    setModalAction({ type, user });
    setShowModal(true);
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-2 md:flex-row md:items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-teal-400" />
              {t("userManagement") || "User Management"}</h1>
            <p className="text-sm text-slate-400 mt-1">{t("manageSystemAccessRolesAndSecurity") || "Manage system access, roles, and security."}</p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                className="pl-9 py-2 pr-8 text-sm appearance-none min-w-[140px] bg-slate-900/50 border border-white/10 rounded-lg text-white outline-none focus:border-teal-500"
                value={roleFilter}
                onChange={(e: DynamicStateObject) => setRoleFilter(e.target.value)}
              >
                <option value="">{t("allRoles") || "All Roles"}</option>
                <option value="ADMIN">{t("admin") || "Admin"}</option>
                <option value="DOCTOR">{t("doctor") || "Doctor"}</option>
                <option value="PATIENT">{t("patient") || "Patient"}</option>
                <option value="CAREGIVER">{t("caregiver") || "Caregiver"}</option>
                <option value="PHARMACIST">{t("pharmacist") || "Pharmacist"}</option>
              </select>
            </div>
            <select
              className="py-2 px-4 pr-8 text-sm appearance-none min-w-[140px] bg-slate-900/50 border border-white/10 rounded-lg text-white outline-none focus:border-teal-500"
              value={statusFilter}
              onChange={(e: DynamicStateObject) => setStatusFilter(e.target.value)}
            >
              <option value="">{t("allStatuses") || "All Statuses"}</option>
              <option value="true">{t("activeOnly") || "Active Only"}</option>
              <option value="false">{t("suspendedOnly") || "Suspended Only"}</option>
            </select>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center p-12 text-slate-400">{t("loadingUsers") || "Loading users..."}</div>
        ) : error ? (
          <p className="text-rose-400 p-4 bg-rose-500/10 rounded-lg border border-rose-500/20">{error}</p>
        ) : (
          <div className="bg-slate-900/80 rounded-2xl border border-white/10 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-900 border-b border-white/10">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-300 uppercase tracking-wider">{t("user") || "User"}</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-300 uppercase tracking-wider">{t("role") || "Role"}</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-300 uppercase tracking-wider">{t("status") || "Status"}</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-300 uppercase tracking-wider text-right">{t("actions") || "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((user: DynamicStateObject) => (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">{user.fullName}</p>
                        <p className="text-sm text-slate-400">{user.email}</p>
                        <p className="text-xs text-slate-500">{user.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 rounded-md bg-slate-800 text-xs font-medium text-slate-300 border border-white/10">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 text-xs font-semibold text-teal-400 border border-teal-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {t("active") || "Active"}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-xs font-semibold text-rose-400 border border-rose-500/20">
                            <XCircle className="w-3.5 h-3.5" /> {t("suspended") || "Suspended"}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => openModal('reset', user)}
                            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            {t("resetPassword") || "Reset Password"}</button>
                          {user.active ? (
                            <button
                              onClick={() => openModal('suspend', user)}
                              className="text-xs font-medium text-rose-400 hover:text-rose-300 transition-colors"
                            >
                              {t("suspend") || "Suspend"}</button>
                          ) : (
                            <button
                              onClick={() => openModal('reactivate', user)}
                              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                              {t("reactivate") || "Reactivate"}</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      {/* @ts-expect-error - Auto-suppressed during migration */}
                      <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                        {t("noUsersFoundMatchingTheSelectedFilters") || "No users found matching the selected filters."}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && modalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-start gap-4 mb-4">
              <div className={`p-3 rounded-full shrink-0 ${modalAction.type === 'suspend' ? 'bg-rose-500/10 text-rose-400' : 'bg-teal-500/10 text-teal-400'}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {modalAction.type === 'suspend' && 'Suspend User'}
                  {modalAction.type === 'reactivate' && 'Reactivate User'}
                  {modalAction.type === 'reset' && 'Reset Password'}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {modalAction.type === 'suspend' && `Are you sure you want to suspend ${modalAction.user.fullName}? They will immediately lose access to the system.`}
                  {modalAction.type === 'reactivate' && `Are you sure you want to reactivate ${modalAction.user.fullName}? They will regain access.`}
                  {modalAction.type === 'reset' && `Are you sure you want to trigger a password reset for ${modalAction.user.fullName}? A link will be emailed to ${modalAction.user.email}.`}
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5 transition" onClick={() => setShowModal(false)}>{t("cancel") || "Cancel"}</button>
              <button 
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white shadow transition ${
                  modalAction.type === 'suspend' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-teal-600 hover:bg-teal-700'
                }`} 
                onClick={confirmAction}
              >
                {t("confirm") || "Confirm"}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
