"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getDocumentById, getFieldsForForm, applyPrefillFromProfile, type LegalDocument, PARENTESCO_OPTIONS, BASE_PRICE, SAVE_FOREVER_PRICE } from "@/lib/documents";
import {
  parsePersonList,
  serializePersonList,
  parseMoneyValue,
  sanitizeMoneyInput,
  formatMoneyInputValue,
  normalizeMoneyOnBlur,
  buildUserInputsForApi,
  toTitleCase,
  type PersonEntry,
} from "@/lib/formatters";
import { useAuth } from "@/lib/auth-context";
import { useUserProfile } from "@/lib/use-user-profile";
import { useI18n } from "@/lib/i18n-context";
import { getFieldDisplayLabel, DOC_NAME_DESC_KEYS, PARENTESCO_OPTIONS_EN } from "@/lib/translations";
import { isSuperUser } from "@/lib/superuser";
import { Navbar } from "@/components/navbar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DateInput } from "@/components/ui/date-input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { shouldSkipPayment } from "@/lib/superuser";
import { createCheckoutSession } from "@/lib/stripe";
import { PREVIEW_STORAGE_KEYS } from "@/lib/preview-utils";
import { parseDDMMYYYY, isValidDate, getTodayDDMMYYYY } from "@/lib/date-utils";
import { CiudadPieSelector } from "@/components/ciudad-pie-selector";
import { DomicilioNotificacionesSelector } from "@/components/domicilio-notificaciones-selector";

const PENDING_FORM_KEY = "avatar_pending_form";

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { t, locale } = useI18n();
  const parentescoOptions = locale === "en" ? PARENTESCO_OPTIONS_EN : PARENTESCO_OPTIONS;
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [saveForever, setSaveForever] = useState(false);
  const [promoInfo, setPromoInfo] = useState<{ hasPromo: boolean; freeDocsRemaining: number } | null>(null);
  const [abogados, setAbogados] = useState<{ id: string; nombreCompleto: string; nombreDespacho: string; email: string }[]>([]);
  const [selectedAbogadoId, setSelectedAbogadoId] = useState("");
  const [abogadosLoading, setAbogadosLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    const doc = getDocumentById(params.id as string);
    setDocument(doc || null);
    if (!doc) return;

    const initialData: Record<string, string> = {};
    getFieldsForForm(doc).forEach((field) => {
      if (field.type === "person_list") {
        initialData[field.id] = serializePersonList([{ nombre: "", parentesco: "" }]);
      } else {
        initialData[field.id] = "";
      }
    });

    // Prellenar desde perfil (todos los campos prellenables para los 6 documentos)
    applyPrefillFromProfile(initialData, doc, profile, getTodayDDMMYYYY());

    try {
      const pending = typeof window !== "undefined" ? sessionStorage.getItem(PENDING_FORM_KEY) : null;
      if (pending) {
        const parsed = JSON.parse(pending) as { documentId: string; formData?: Record<string, string>; saveForever?: boolean; legalAccepted?: boolean; selectedAbogadoId?: string };
        if (parsed.documentId === doc.id && parsed.formData && typeof parsed.formData === "object") {
          const restored: Record<string, string> = { ...initialData };
          for (const key of Object.keys(parsed.formData)) {
            if (key in restored) restored[key] = String(parsed.formData[key] ?? "");
          }
          setFormData(restored);
          if (typeof parsed.saveForever === "boolean") setSaveForever(parsed.saveForever);
          if (typeof parsed.legalAccepted === "boolean") setLegalAccepted(parsed.legalAccepted);
          if (typeof parsed.selectedAbogadoId === "string") setSelectedAbogadoId(parsed.selectedAbogadoId);
          sessionStorage.removeItem(PENDING_FORM_KEY);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    setFormData(initialData);
  }, [params.id, profile]);

  useEffect(() => {
    const fetchPromo = async () => {
      if (!user || !document) return;
      if (shouldSkipPayment(user.email)) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/promo-check", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setPromoInfo({
          hasPromo: !!data.hasPromo,
          freeDocsRemaining: data.freeDocsRemaining ?? 0,
        });
      } catch {
        setPromoInfo({ hasPromo: false, freeDocsRemaining: 0 });
      }
    };
    fetchPromo();
  }, [user, document]);

  useEffect(() => {
    const fetchAbogados = async () => {
      try {
        const res = await fetch("/api/abogados/list");
        const data = await res.json();
        const list = data.abogados ?? [];
        setAbogados(list);
        if (list.length > 0) {
          setSelectedAbogadoId((prev) => prev || list[0].id);
        }
      } catch {
        setAbogados([]);
      } finally {
        setAbogadosLoading(false);
      }
    };
    fetchAbogados();
  }, []);

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handlePersonChange = (fieldId: string, index: number, key: keyof PersonEntry, value: string) => {
    setFormData((prev) => {
      const list = parsePersonList(prev[fieldId]);
      list[index] = { ...list[index], [key]: value };
      return { ...prev, [fieldId]: serializePersonList(list) };
    });
  };

  const handleAddPerson = (fieldId: string) => {
    setFormData((prev) => {
      const list = parsePersonList(prev[fieldId]);
      return { ...prev, [fieldId]: serializePersonList([...list, { nombre: "", parentesco: "" }]) };
    });
  };

  const handleRemovePerson = (fieldId: string, index: number) => {
    setFormData((prev) => {
      const list = parsePersonList(prev[fieldId]).filter((_, i) => i !== index);
      return { ...prev, [fieldId]: serializePersonList(list.length ? list : [{ nombre: "", parentesco: "" }]) };
    });
  };

  const handleMoneyChange = (fieldId: string, value: string) => {
    const sinComas = value.replace(/,/g, "");
    const sanitized = sanitizeMoneyInput(sinComas);
    setFormData((prev) => ({ ...prev, [fieldId]: sanitized }));
  };

  const handleMoneyBlur = (fieldId: string) => {
    const raw = formData[fieldId] ?? "";
    if (!raw.trim()) return;
    const normalized = normalizeMoneyOnBlur(raw);
    if (normalized !== raw) setFormData((prev) => ({ ...prev, [fieldId]: normalized }));
  };

  const handlePayment = async () => {
    if (!user) {
      if (document) {
        try {
          sessionStorage.setItem(
            PENDING_FORM_KEY,
            JSON.stringify({
              documentId: document.id,
              formData,
              saveForever,
              legalAccepted,
            })
          );
        } catch {
          /* ignore */
        }
        router.push(`/auth?returnTo=${encodeURIComponent(`/documentos/${document.id}`)}`);
      } else {
        router.push("/auth");
      }
      return;
    }

    if (!document) return;

    const needsAbogado = !shouldSkipPayment(user?.email) && abogados.length > 0;
    if (needsAbogado && !selectedAbogadoId) {
      setError(t("doc_select_abogado"));
      return;
    }
    if (abogados.length === 0 && !shouldSkipPayment(user?.email)) {
      setError(t("doc_no_abogados"));
      return;
    }
    if (!legalAccepted) {
      setError(t("legal_checkout_agree"));
      return;
    }

    // Validar campos requeridos
    const missingFields: string[] = [];
    const allFields = getFieldsForForm(document);
    for (const field of allFields) {
      if (!field.required) continue;
      const label = getFieldDisplayLabel(document.id, field, t);
      if (field.type === "person_list") {
        const list = parsePersonList(formData[field.id]);
        const hasValid = list.some((p) => p.nombre.trim() !== "");
        if (!hasValid) missingFields.push(label);
      } else if (field.type === "date") {
        const val = formData[field.id]?.trim() ?? "";
        if (!val) {
          missingFields.push(label);
        } else {
          const parsed = parseDDMMYYYY(val);
          if (!parsed || !isValidDate(parsed.day, parsed.month, parsed.year))
            missingFields.push(label);
        }
      } else if (field.money) {
        const n = parseMoneyValue(formData[field.id] ?? "");
        if (n === null || isNaN(n)) missingFields.push(label);
      } else if (!formData[field.id]?.trim()) {
        missingFields.push(label);
      }
    }
    if (missingFields.length > 0) {
      setError(`${t("doc_please_complete")}: ${missingFields.join(", ")}`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Guardar datos del formulario y abogado seleccionado en sessionStorage
      sessionStorage.setItem(`formData_${document.id}`, JSON.stringify(formData));
      sessionStorage.setItem(`selectedAbogadoId_${document.id}`, selectedAbogadoId || "");
      
      // Si tiene documentos gratis (promo primeros 10), usar uno
      const canUsePromo = promoInfo?.hasPromo && (promoInfo?.freeDocsRemaining ?? 0) > 0;
      if (canUsePromo) {
        const token = await user.getIdToken();
        const useRes = await fetch("/api/promo-use", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!useRes.ok) {
          const useData = await useRes.json().catch(() => ({}));
          throw new Error(useData.error || "No se pudo usar el documento gratis");
        }
        const useData = await useRes.json();
        setPromoInfo((p) => (p ? { ...p, freeDocsRemaining: useData.remaining } : p));
        const genRes = await fetch("/api/generate-document", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            documentId: document.id,
            documentType: document.name,
            userInputs: buildUserInputsForApi(formData, document),
            sessionId: `promo-${Date.now()}`,
            saveToAccount: saveForever,
            abogadoId: selectedAbogadoId || null,
          }),
        });
        if (!genRes.ok) {
          let msg = t("doc_error_generate");
          try {
            const body = await genRes.json();
            if (body?.error && typeof body.error === "string") msg = body.error;
          } catch { /* ignore */ }
          throw new Error(msg);
        }
        const data = await genRes.json();
        const content = data.content as string;
        sessionStorage.setItem(PREVIEW_STORAGE_KEYS.content, content);
        sessionStorage.setItem(PREVIEW_STORAGE_KEYS.original, content);
        sessionStorage.setItem(PREVIEW_STORAGE_KEYS.editsLeft, "2");
        sessionStorage.setItem(PREVIEW_STORAGE_KEYS.recreatesLeft, "2");
        sessionStorage.setItem(PREVIEW_STORAGE_KEYS.documentId, document.id);
        router.push(`/documentos/${document.id}/preview`);
        return;
      }

      // Si es superusuario, saltar el pago y generar directamente
      if (shouldSkipPayment(user.email)) {
        const token = await user.getIdToken();
        const response = await fetch("/api/generate-document", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            documentId: document.id,
            documentType: document.name,
            userInputs: buildUserInputsForApi(formData, document),
            sessionId: `superuser-${Date.now()}`,
            abogadoId: selectedAbogadoId || null,
          }),
        });

        if (!response.ok) {
          let msg = t("doc_error_generate");
          try {
            const body = await response.json();
            if (body?.error && typeof body.error === "string") msg = body.error;
          } catch {
            // ignorar si no es JSON
          }
          throw new Error(msg);
        }

        const data = await response.json();
        const content = data.content as string;
        sessionStorage.setItem(PREVIEW_STORAGE_KEYS.content, content);
        sessionStorage.setItem(PREVIEW_STORAGE_KEYS.original, content);
        sessionStorage.setItem(PREVIEW_STORAGE_KEYS.editsLeft, "2");
        sessionStorage.setItem(PREVIEW_STORAGE_KEYS.recreatesLeft, "2");
        sessionStorage.setItem(PREVIEW_STORAGE_KEYS.documentId, document.id);
        router.push(`/documentos/${document.id}/preview`);
        return;
      }
      
      // Usuario normal: redirigir a Stripe Checkout (token en header + body; retry con token fresco si 401)
      const price = saveForever ? SAVE_FOREVER_PRICE : BASE_PRICE;
      const tryPayment = async (): Promise<string | null> => {
        const token = await user.getIdToken(true);
        const result = await createCheckoutSession(document.id, price, saveForever, token);
        return result.url;
      };
      let url: string | null = null;
      try {
        url = await tryPayment();
      } catch (firstErr: any) {
        const msg = firstErr?.message ?? "";
        if (msg.includes("iniciar sesión") || msg.includes("Debes iniciar")) {
          await new Promise((r) => setTimeout(r, 400));
          try {
            url = await tryPayment();
          } catch (secondErr) {
            throw secondErr;
          }
        } else {
          throw firstErr;
        }
      }
      if (url) {
        window.location.href = url;
      } else {
        throw new Error(t("doc_error_payment"));
      }
    } catch (err: any) {
      setError(err.message || t("doc_error_payment"));
    } finally {
      setLoading(false);
    }
  };

  const docNameDesc = document ? DOC_NAME_DESC_KEYS[document.id] : null;
  const docName = docNameDesc ? t(docNameDesc.name) : document?.name ?? "";
  const docDesc = docNameDesc ? t(docNameDesc.desc) : document?.description ?? "";

  if (!document) {
    return (
      <div className="min-h-screen text-foreground">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">{t("doc_not_found")}</h1>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground">
      <Navbar />
      <main id="main" className="max-w-4xl lg:max-w-5xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 pt-20 sm:pt-24 pb-12 sm:pb-16 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect hover-box p-5 sm:p-6 md:p-8 lg:p-10 rounded-xl border border-blue-500/40 group"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 sm:mb-8 gap-4 sm:gap-6">
            <div className="flex-1 min-w-0">
              <div className="text-4xl sm:text-5xl mb-4 origin-left transition-transform duration-300 ease-out group-hover:scale-125 group-hover:translate-x-1">{document.icon}</div>
              <h1 className="hover-title text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 text-foreground break-words">{docName}</h1>
              <p className="text-muted text-sm sm:text-base md:text-lg break-words">{docDesc}</p>
            </div>
            <div className="text-left sm:text-right flex-shrink-0">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-500">
                {t("doc_price_base")}
                <span className="text-xs sm:text-sm text-muted font-normal block mt-1">{t("doc_download_only_desc")}</span>
              </div>
            </div>
          </div>

          <div className="space-y-5 sm:space-y-6 md:space-y-8 mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground">{t("doc_complete_info")}</h2>

            {!user && (
              <div className="p-4 rounded-lg border-2 border-amber-500/50 bg-amber-500/10 dark:bg-amber-500/15 dark:border-amber-400/50">
                <p className="text-sm font-medium text-foreground">
                  {t("doc_login_first_note")}
                </p>
                <Link
                  href={`/auth?returnTo=${encodeURIComponent(`/documentos/${document.id}`)}`}
                  className="inline-block mt-2 text-sm font-semibold text-blue-500 hover:text-blue-400"
                >
                  → {t("auth_sign_in")}
                </Link>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
                {error}
              </div>
            )}

            {getFieldsForForm(document).map((field) => {
              const label = getFieldDisplayLabel(document.id, field, t);
              return (
                <div key={field.id}>
                  {field.id === "ciudad_pie" ? (
                    <CiudadPieSelector
                      id={field.id}
                      value={formData[field.id] || ""}
                      onChange={(val) => handleInputChange(field.id, val)}
                      label={getFieldDisplayLabel(document.id, field, t)}
                      required={field.required}
                    />
                  ) : field.id === "domicilio_notificaciones_1" || field.id === "domicilio_notificaciones_2" ? (
                    <DomicilioNotificacionesSelector
                      id={field.id}
                      value={formData[field.id] || ""}
                      onChange={(val) => handleInputChange(field.id, val)}
                      label={label}
                      required={field.required}
                    />
                  ) : field.type === "person_list" ? (
                    <div className="space-y-4">
                      <label htmlFor={`${field.id}-nombre-0`} className="block text-sm font-medium mb-2 text-foreground">
                        {label}
                        {field.required && <span className="text-red-400 ml-1">*</span>}
                      </label>
                      {parsePersonList(formData[field.id] || "").map((person, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 rounded-lg bg-card border border-border">
                          <div className="flex-1 w-full sm:min-w-[160px] md:min-w-[200px]">
                            <Input
                              id={`${field.id}-nombre-${idx}`}
                              name={`${field.id}-nombre-${idx}`}
                              value={person.nombre}
                              onChange={(e) => handlePersonChange(field.id, idx, "nombre", e.target.value)}
                              onBlur={() => {
                                const title = toTitleCase(person.nombre);
                                if (title !== person.nombre) handlePersonChange(field.id, idx, "nombre", title);
                              }}
                              placeholder={t("doc_name")}
                            />
                          </div>
                          <div className="flex-1 w-full sm:min-w-[160px] md:min-w-[200px]">
                            <select
                              id={`${field.id}-parentesco-${idx}`}
                              name={`${field.id}-parentesco-${idx}`}
                              value={person.parentesco}
                              onChange={(e) => handlePersonChange(field.id, idx, "parentesco", e.target.value)}
                              className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground dark:bg-gray-800/90 dark:border-gray-600/50 dark:text-gray-100 focus:outline-none focus:border-blue-500/50 text-sm sm:text-base"
                            >
                              <option value="">{t("doc_relationship")}</option>
                              {parentescoOptions.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                          {parsePersonList(formData[field.id] || "").length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePerson(field.id, idx)}
                              className="p-2 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title={t("doc_remove")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleAddPerson(field.id)}
                        className="flex items-center gap-2 text-blue-500 hover:text-blue-400 text-sm font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        {t("doc_add_more")}
                      </button>
                    </div>
                  ) : field.type === "textarea" ? (
                    <>
                      <label htmlFor={field.id} className="block text-sm font-medium mb-2 text-foreground">
                        {label}
                        {field.required && <span className="text-red-400 ml-1">*</span>}
                      </label>
                      <Textarea
                        id={field.id}
                        name={field.id}
                        value={formData[field.id] || ""}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        required={field.required}
                        placeholder={field.placeholder}
                        rows={4}
                      />
                    </>
                  ) : field.type === "select" && field.options ? (
                    <>
                      <label htmlFor={field.id} className="block text-sm font-medium mb-2 text-foreground">
                        {label}
                        {field.required && <span className="text-red-400 ml-1">*</span>}
                      </label>
                      <select
                        id={field.id}
                        name={field.id}
                        value={formData[field.id] || ""}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        required={field.required}
                        className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground dark:bg-gray-800/90 dark:border-gray-600/50 dark:text-gray-100 focus:outline-none focus:border-blue-500/50"
                      >
                        <option value="">{t("doc_select_option")}</option>
                        {field.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : field.type === "date" ? (
                    <>
                      <label htmlFor={field.id} className="block text-sm font-medium mb-2 text-foreground">
                        {label}
                        {field.required && <span className="text-red-400 ml-1">*</span>}
                      </label>
                      <DateInput
                        id={field.id}
                        name={field.id}
                        value={formData[field.id] || ""}
                        onChange={(val) => handleInputChange(field.id, val)}
                        placeholder="dd/mm/aaaa"
                        required={field.required}
                        aria-label={label}
                      />
                    </>
                  ) : field.money ? (
                    <>
                      <label htmlFor={field.id} className="block text-sm font-medium mb-2 text-foreground">
                        {label}
                        {field.required && <span className="text-red-400 ml-1">*</span>}
                      </label>
                      <div className="flex items-center rounded-lg border border-border bg-card dark:bg-gray-800/90 dark:border-gray-600/50 overflow-hidden focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20">
                        <span className="pl-4 text-muted dark:text-gray-400">$</span>
                        <input
                          id={field.id}
                          name={field.id}
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9.]*"
                          autoComplete="off"
                          value={formatMoneyInputValue(formData[field.id] ?? "")}
                          onChange={(e) => handleMoneyChange(field.id, e.target.value)}
                          onBlur={() => handleMoneyBlur(field.id)}
                          placeholder="0.00"
                          className="flex-1 min-w-0 px-3 py-3 bg-transparent text-foreground dark:text-gray-100 placeholder:text-muted dark:placeholder:text-gray-400 focus:outline-none"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <label htmlFor={field.id} className="block text-sm font-medium mb-2 text-foreground">
                        {label}
                        {field.required && <span className="text-red-400 ml-1">*</span>}
                      </label>
                      <Input
                        id={field.id}
                        name={field.id}
                        type={field.type}
                        autoComplete={field.id.includes("email") ? "email" : "off"}
                        value={formData[field.id] || ""}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        onBlur={
                          field.capitalizeWords
                            ? () => {
                                const val = formData[field.id] || "";
                                const title = toTitleCase(val);
                                if (title !== val) handleInputChange(field.id, title);
                              }
                            : undefined
                        }
                        required={field.required}
                        placeholder={field.placeholder}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {!abogadosLoading && (
            <div className="mb-6 p-4 rounded-xl border-2 border-blue-500/40 bg-blue-500/5 dark:bg-blue-500/10">
              <h3 className="text-sm font-semibold text-foreground mb-2">{t("doc_select_abogado")}</h3>
              {abogados.length === 0 ? (
                <p className="text-sm text-amber-600 dark:text-amber-400">{t("doc_no_abogados")}</p>
              ) : (
                <select
                  id="abogado-select"
                  name="abogadoId"
                  value={selectedAbogadoId}
                  onChange={(e) => setSelectedAbogadoId(e.target.value)}
                  className="w-full mt-2 px-4 py-3 bg-card border border-border rounded-lg text-foreground dark:bg-gray-800/90 dark:border-gray-600/50 focus:outline-none focus:border-blue-500/50"
                >
                  <option value="">{t("doc_select_abogado_placeholder")}</option>
                  {abogados.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombreCompleto || a.email}
                      {a.nombreDespacho ? ` — ${a.nombreDespacho}` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="mb-6 p-4 rounded-lg border-2 border-amber-500/60 bg-amber-500/10 dark:bg-amber-500/15 dark:border-amber-400/50">
            <h3 className="text-sm font-semibold text-foreground mb-2">{t("legal_checkout_title")}</h3>
            <p className="text-sm text-muted mb-4 leading-relaxed">{t("legal_checkout_text")}</p>
            <label htmlFor="legal-accept" className="flex items-start gap-3 cursor-pointer">
              <input
                id="legal-accept"
                name="legalAccepted"
                type="checkbox"
                checked={legalAccepted}
                onChange={(e) => setLegalAccepted(e.target.checked)}
                className="mt-1 rounded border-border bg-card text-blue-500 focus:ring-blue-500/50"
              />
              <span className="text-sm font-medium text-foreground">{t("legal_checkout_agree")}</span>
            </label>
          </div>

          {isSuperUser(user?.email) && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-black dark:text-white text-sm">
              ⭐ {t("doc_superuser_badge")}
            </div>
          )}

          {!isSuperUser(user?.email) && user && promoInfo?.hasPromo && (promoInfo?.freeDocsRemaining ?? 0) > 0 && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm">
              🎉 {t("doc_promo_badge").replace("{{count}}", String(promoInfo.freeDocsRemaining))}
            </div>
          )}

          {!isSuperUser(user?.email) && user && (
            <div className="mb-4 p-4 rounded-xl border-2 border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10">
              <p className="text-sm font-medium text-foreground mb-2">{t("doc_choose_option")}</p>
              <p className="text-sm text-muted mb-3">{t("doc_save_cloud_question")}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setSaveForever(false)}
                  className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
                    !saveForever ? "border-blue-500 bg-blue-500/10 text-foreground" : "border-border text-muted hover:border-blue-500/50"
                  }`}
                >
                  <span className="font-bold text-lg">{t("doc_price_base")}</span>
                  <p className="text-sm mt-1 text-muted">{t("doc_download_only_desc")}</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSaveForever(true)}
                  className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
                    saveForever ? "border-blue-500 bg-blue-500/10 text-foreground" : "border-border text-muted hover:border-blue-500/50"
                  }`}
                >
                  <span className="font-bold text-lg">{t("doc_price_plus_save")}</span>
                  <p className="text-sm mt-1 text-muted">{t("doc_save_forever_desc")}</p>
                </button>
              </div>
            </div>
          )}

          <Button
              onClick={handlePayment}
              disabled={loading}
              className="w-full i18n-stable-btn min-w-[18rem] sm:min-w-[22rem] ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:ring-blue-500/60"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {isSuperUser(user?.email) ? t("doc_generating") : t("doc_processing_payment")}
                </>
              ) : isSuperUser(user?.email) ? (
                t("doc_generate_free")
              ) : (promoInfo?.hasPromo && (promoInfo?.freeDocsRemaining ?? 0) > 0) ? (
                t("doc_promo_use_free").replace("{{count}}", String(promoInfo.freeDocsRemaining))
              ) : (
                saveForever ? t("doc_pay_49_and_generate") : t("doc_pay_29_and_generate")
              )}
            </Button>

          {!user && (
            <p className="text-center text-muted mt-4 text-sm">
              {t("doc_need_login")}{" "}
              <Link href="/auth" className="text-blue-500 hover:text-blue-400">
                {t("doc_login_link")}
              </Link>{" "}
              {t("doc_to_continue")}
            </p>
          )}
        </motion.div>
      </main>
    </div>
  );
}
