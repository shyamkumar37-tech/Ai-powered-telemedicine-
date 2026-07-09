import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../utils/queryKeys";
import PharmacistPremiumCard from "../components/PharmacistPremiumCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { createPharmacistInventoryItem, fetchPharmacistInventory } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";
import { AlertTriangle, Package, Calendar, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "../components/ui/ToastProvider";
import { flexRender, getCoreRowModel, getSortedRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";

export default function PharmacistInventoryPage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const pharmacistId = auth.profileId ?? auth.userId;
  
  const [sorting, setSorting] = useState([]);
  
  const [form, setForm] = useState({
    medicineName: "",
    formulation: "",
    quantityAvailable: "",
    reorderLevel: "",
    unitLabel: "",
    expiryDate: "",
    batchNumber: ""
  });
  const [formErrors, setFormErrors] = useState({});

  const { data: items = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ['pharmacist', pharmacistId, 'inventory'],
    queryFn: () => fetchPharmacistInventory(pharmacistId),
    enabled: !!pharmacistId
  });

  const mutation = useMutation({
    mutationFn: (newItem) => createPharmacistInventoryItem(pharmacistId, newItem),
    onSuccess: () => {
      queryClient.invalidateQueries(['pharmacist', pharmacistId, 'inventory']);
      pushToast({ title: "Success", message: t("inventoryItemAdded"), type: "success" });
      setForm({ medicineName: "", formulation: "", quantityAvailable: "", reorderLevel: "", unitLabel: "", expiryDate: "", batchNumber: "" });
    },
    onError: (err) => {
      pushToast({ title: "Error", message: getApiErrorMessage(err, t("unableSaveInventoryItem")), type: "error" });
    }
  });

  const validateForm = () => {
    const errs = {};
    if (!form.medicineName.trim()) errs.medicineName = "Medicine name is required";
    if (form.quantityAvailable === "" || isNaN(Number(form.quantityAvailable))) errs.quantityAvailable = "Valid quantity required";
    if (form.reorderLevel === "" || isNaN(Number(form.reorderLevel))) errs.reorderLevel = "Valid reorder level required";
    if (!form.unitLabel.trim()) errs.unitLabel = "Unit label is required (e.g., tablets)";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    mutation.mutate({
      ...form,
      quantityAvailable: Number(form.quantityAvailable),
      reorderLevel: Number(form.reorderLevel)
    });
  };

  const getUrgencyBadge = (item) => {
    if (item.quantityAvailable === 0) {
      return <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold badge-critical">Critical</span>;
    }
    if (item.quantityAvailable <= item.reorderLevel) {
      return <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold badge-low">Low Stock</span>;
    }
    return <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold badge-normal">Normal</span>;
  };

  const isExpiringSoon = (dateStr) => {
    if (!dateStr) return false;
    const expiry = new Date(dateStr);
    const in60Days = new Date();
    in60Days.setDate(in60Days.getDate() + 60);
    return expiry <= in60Days && expiry >= new Date();
  };

  const columns = useMemo(() => [
    {
      accessorKey: "medicineName",
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="flex items-center gap-1 hover:text-white transition-colors">
          Medicine <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-white">{row.original.medicineName}</div>
          <div className="text-xs text-slate-400">{row.original.formulation || row.original.unitLabel}</div>
        </div>
      )
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1 items-start">
          {getUrgencyBadge(row.original)}
          {isExpiringSoon(row.original.expiryDate) && (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold badge-low mt-1">
              <AlertTriangle className="h-3 w-3" /> Expiring Soon
            </span>
          )}
        </div>
      )
    },
    {
      accessorKey: "quantityAvailable",
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="flex items-center gap-1 hover:text-white transition-colors">
          Available <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-slate-200">
          <span className="font-bold">{row.original.quantityAvailable}</span> {translateDisplayText(language, row.original.unitLabel)}
        </div>
      )
    },
    {
      accessorKey: "reorderLevel",
      header: "Reorder At",
      cell: ({ row }) => <div className="text-sm text-slate-400">{row.original.reorderLevel}</div>
    },
    {
      accessorKey: "expiryDate",
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="flex items-center gap-1 hover:text-white transition-colors">
          Expiry <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-slate-300 flex items-center gap-1">
          <Calendar className="h-3 w-3 text-slate-400" />
          {row.original.expiryDate ? new Date(row.original.expiryDate).toLocaleDateString() : "N/A"}
        </div>
      )
    }
  ], [language]);

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 5 } }
  });

  const error = queryError ? getApiErrorMessage(queryError, t("unableLoadInventory")) : "";

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <PharmacistPremiumCard
        title={
          <span className="inline-flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-400" />
            {t("pharmacyInventory")}
          </span>
        }
        action={
          <button
            className="ph-btn ph-btn-primary"
            type="button"
            disabled={mutation.isPending}
            onClick={handleSave}
          >
            {mutation.isPending ? t("saving") : t("addItem")}
          </button>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Medicine Name</label>
            <input className={`ph-input ${formErrors.medicineName ? 'border-red-500' : ''}`} placeholder="e.g. Amoxicillin" value={form.medicineName} onChange={(e) => setForm({ ...form, medicineName: e.target.value })} />
            {formErrors.medicineName && <p className="text-red-400 text-xs mt-1">{formErrors.medicineName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Formulation</label>
            <input className="ph-input" placeholder="e.g. 500mg capsule" value={form.formulation} onChange={(e) => setForm({ ...form, formulation: e.target.value })} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Quantity in Stock</label>
              <input className={`ph-input ${formErrors.quantityAvailable ? 'border-red-500' : ''}`} type="number" placeholder="0" value={form.quantityAvailable} onChange={(e) => setForm({ ...form, quantityAvailable: e.target.value })} />
              {formErrors.quantityAvailable && <p className="text-red-400 text-xs mt-1">{formErrors.quantityAvailable}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Reorder Threshold</label>
              <input className={`ph-input ${formErrors.reorderLevel ? 'border-red-500' : ''}`} type="number" placeholder="0" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} />
              {formErrors.reorderLevel && <p className="text-red-400 text-xs mt-1">{formErrors.reorderLevel}</p>}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Unit Context</label>
              <input className={`ph-input ${formErrors.unitLabel ? 'border-red-500' : ''}`} placeholder="e.g. tablets, ml" value={form.unitLabel} onChange={(e) => setForm({ ...form, unitLabel: e.target.value })} />
              {formErrors.unitLabel && <p className="text-red-400 text-xs mt-1">{formErrors.unitLabel}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Batch Number</label>
              <input className="ph-input" placeholder="e.g. BATCH-123" value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Expiry Date</label>
              <input className="ph-input" type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
            </div>
          </div>
        </div>
      </PharmacistPremiumCard>

      <PharmacistPremiumCard title={t("inventoryList")}>
        {loading ? <LoadingSkeleton lines={4} /> : null}
        {!loading && error ? (
          <ErrorStateCard
            title={t("unableLoadInventory")}
            body={error}
            actionLabel={t("retry")}
            onAction={() => queryClient.invalidateQueries(['pharmacist', pharmacistId, 'inventory'])}
          />
        ) : null}
        {!loading && !error && !items.length ? (
          <EmptyStateCard
            title={t("noInventoryItems")}
            body={translateDisplayText(language, "Add your first medicine to build the inventory list.")}
          />
        ) : null}
        
        {!loading && !error && items.length > 0 && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-tcd-panel-line">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id} className="bg-tcd-panel-2 border-b border-tcd-panel-line">
                      {headerGroup.headers.map(header => (
                        <th key={header.id} className="p-3 font-medium text-slate-400 whitespace-nowrap">
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-tcd-panel-line">
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="bg-tcd-panel hover:bg-tcd-panel-2 transition-colors">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="p-3 whitespace-nowrap align-top">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                className="ph-btn ph-btn-secondary text-xs px-2 py-1"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              <button
                className="ph-btn ph-btn-secondary text-xs px-2 py-1"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </PharmacistPremiumCard>
    </div>
  );
}
