import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { createPharmacistInventoryItem, fetchPharmacistInventory } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";

export default function PharmacistInventoryPage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const pharmacistId = auth.profileId ?? auth.userId;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    medicineName: "",
    formulation: "",
    quantityAvailable: 0,
    reorderLevel: 0,
    unitLabel: ""
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchPharmacistInventory(pharmacistId);
      setItems(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, t("unableLoadInventory")));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [pharmacistId]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <SectionCard
        title={t("pharmacyInventory")}
        action={
          <button
            className="btn-primary"
            type="button"
            disabled={saving}
            aria-label={saving ? t("saving") : t("addItem")}
            data-voice-label={saving ? t("saving") : t("addItem")}
            onClick={async () => {
              try {
                setSaving(true);
                const created = await createPharmacistInventoryItem(pharmacistId, {
                  ...form,
                  quantityAvailable: Number(form.quantityAvailable),
                  reorderLevel: Number(form.reorderLevel)
                });
                setItems((current) => [...current, created].sort((a, b) => a.medicineName.localeCompare(b.medicineName)));
                setForm({ medicineName: "", formulation: "", quantityAvailable: 0, reorderLevel: 0, unitLabel: "" });
                setMessage(t("inventoryItemAdded"));
                setError("");
              } catch (err) {
                setError(getApiErrorMessage(err, t("unableSaveInventoryItem")));
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? t("saving") : t("addItem")}
          </button>
        }
      >
        <div className="space-y-4">
          <input className="field" placeholder={t("medicineName")} aria-label={t("medicineName")} data-voice-label={t("medicineName")} value={form.medicineName} onChange={(event) => setForm({ ...form, medicineName: event.target.value })} />
          <input className="field" placeholder={t("formulation")} aria-label={t("formulation")} data-voice-label={t("formulation")} value={form.formulation} onChange={(event) => setForm({ ...form, formulation: event.target.value })} />
          <div className="grid gap-4 md:grid-cols-2">
            <input className="field" type="number" placeholder={t("quantityAvailable")} aria-label={t("quantityAvailable")} data-voice-label={t("quantityAvailable")} value={form.quantityAvailable} onChange={(event) => setForm({ ...form, quantityAvailable: event.target.value })} />
            <input className="field" type="number" placeholder={t("reorderLevel")} aria-label={t("reorderLevel")} data-voice-label={t("reorderLevel")} value={form.reorderLevel} onChange={(event) => setForm({ ...form, reorderLevel: event.target.value })} />
          </div>
          <input className="field" placeholder={t("unitLabel")} aria-label={t("unitLabel")} data-voice-label={t("unitLabel")} value={form.unitLabel} onChange={(event) => setForm({ ...form, unitLabel: event.target.value })} />
        </div>
        {message ? <p className="mt-4 text-sm text-emerald-600" role="status" aria-live="polite">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600" role="alert">{error}</p> : null}
      </SectionCard>

      <SectionCard title={t("inventoryList")}>
        {loading ? <LoadingSkeleton lines={4} /> : null}
        {!loading && error ? (
          <ErrorStateCard
            title={t("unableLoadInventory")}
            body={error}
            actionLabel={t("retry")}
            onAction={() => load()}
          />
        ) : null}
        {!loading && !error && !items.length ? (
          <EmptyStateCard
            title={t("noInventoryItems")}
            body={translateDisplayText(language, "Add your first medicine to build the inventory list.")}
          />
        ) : null}
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl bg-mist p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{item.medicineName}</p>
                  <p className="text-sm text-slate-500">{item.formulation || item.unitLabel}</p>
                </div>
                {item.lowStock ? <Badge value="WARNING" /> : <Badge value="READY" />}
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <p className="text-sm text-slate-700">{t("availableLabel")}: {item.quantityAvailable} {translateDisplayText(language, item.unitLabel)}</p>
                <p className="text-sm text-slate-700">{t("reorderLevelLabel")}: {item.reorderLevel}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
