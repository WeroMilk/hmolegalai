"use client";

import { useMemo, useCallback } from "react";
import { getEstadosOptions, getMunicipiosOptions } from "@/lib/mexico-locations";
import { Input } from "@/components/ui/input";
import { DocumentSelect } from "@/components/ui/document-select";

export interface DomicilioParts {
  estado: string;
  municipio: string;
  calle: string;
  numeroExterior: string;
  numeroInterior: string;
  colonia: string;
  cp: string;
}

const EMPTY: DomicilioParts = {
  estado: "",
  municipio: "",
  calle: "",
  numeroExterior: "",
  numeroInterior: "",
  colonia: "",
  cp: "",
};

export function domicilioPartsToString(parts: DomicilioParts): string {
  const { estado, municipio, calle, numeroExterior, numeroInterior, colonia, cp } = parts;
  const partsList: string[] = [];
  if (calle?.trim()) {
    let callePart = calle.trim();
    if (numeroExterior?.trim()) callePart += ` ${numeroExterior.trim()}`;
    if (numeroInterior?.trim()) callePart += `, Int. ${numeroInterior.trim()}`;
    partsList.push(callePart);
  }
  if (colonia?.trim()) partsList.push(`Col. ${colonia.trim()}`);
  if (cp?.trim()) partsList.push(`CP ${cp.trim()}`);
  if (municipio?.trim()) partsList.push(municipio.trim());
  if (estado?.trim()) partsList.push(estado.trim());
  return partsList.join(", ");
}

export function parseDomicilioValue(value: string): DomicilioParts {
  if (!value?.trim()) return { ...EMPTY };
  try {
    const parsed = JSON.parse(value) as Partial<DomicilioParts>;
    return {
      estado: parsed.estado ?? "",
      municipio: parsed.municipio ?? "",
      calle: parsed.calle ?? "",
      numeroExterior: parsed.numeroExterior ?? "",
      numeroInterior: parsed.numeroInterior ?? "",
      colonia: parsed.colonia ?? "",
      cp: parsed.cp ?? "",
    };
  } catch {
    return { ...EMPTY };
  }
}

interface DomicilioNotificacionesSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  id?: string;
}

export function DomicilioNotificacionesSelector({
  value,
  onChange,
  label,
  required,
  id: baseId = "domicilio",
}: DomicilioNotificacionesSelectorProps) {
  const parts = useMemo(() => parseDomicilioValue(value), [value]);
  const estadosOptions = useMemo(() => getEstadosOptions(), []);
  const municipiosOptions = useMemo(() => getMunicipiosOptions(parts.estado), [parts.estado]);
  const idEstado = `${baseId}-estado`;
  const idMunicipio = `${baseId}-municipio`;
  const idCalle = `${baseId}-calle`;
  const idNumExt = `${baseId}-numeroExterior`;
  const idNumInt = `${baseId}-numeroInterior`;
  const idColonia = `${baseId}-colonia`;
  const idCp = `${baseId}-cp`;

  const update = useCallback(
    (next: Partial<DomicilioParts>) => {
      const merged = { ...parts, ...next };
      if (next.estado != null && next.estado !== parts.estado) merged.municipio = "";
      onChange(JSON.stringify(merged));
    },
    [parts, onChange]
  );

  return (
    <div className="space-y-3">
      {label && (
        <label htmlFor={idEstado} className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <DocumentSelect
            id={idEstado}
            value={parts.estado}
            onChange={(v) => update({ estado: v })}
            options={estadosOptions}
            placeholder="Estado"
            aria-label="Estado"
          />
        </div>
        <div className="sm:col-span-2">
          <DocumentSelect
            id={idMunicipio}
            value={parts.municipio}
            onChange={(v) => update({ municipio: v })}
            options={municipiosOptions}
            placeholder="Municipio"
            disabled={!parts.estado}
            aria-label="Municipio"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={idCalle} className="sr-only">Calle</label>
          <Input
            id={idCalle}
            name={idCalle}
            autoComplete="street-address"
            value={parts.calle}
            onChange={(e) => update({ calle: e.target.value })}
            placeholder="Calle"
            className="rounded-xl border-border focus:border-blue-500/50"
          />
        </div>
        <div>
          <label htmlFor={idNumExt} className="sr-only">Número exterior</label>
          <Input
            id={idNumExt}
            name={idNumExt}
            autoComplete="off"
            value={parts.numeroExterior}
            onChange={(e) => update({ numeroExterior: e.target.value })}
            placeholder="Núm. exterior"
            className="rounded-xl border-border focus:border-blue-500/50"
          />
        </div>
        <div>
          <label htmlFor={idNumInt} className="sr-only">Número interior (opcional)</label>
          <Input
            id={idNumInt}
            name={idNumInt}
            autoComplete="off"
            value={parts.numeroInterior}
            onChange={(e) => update({ numeroInterior: e.target.value })}
            placeholder="Núm. interior (opcional)"
            className="rounded-xl border-border focus:border-blue-500/50"
          />
        </div>
        <div>
          <label htmlFor={idColonia} className="sr-only">Colonia</label>
          <Input
            id={idColonia}
            name={idColonia}
            autoComplete="address-level3"
            value={parts.colonia}
            onChange={(e) => update({ colonia: e.target.value })}
            placeholder="Colonia"
            className="rounded-xl border-border focus:border-blue-500/50"
          />
        </div>
        <div>
          <label htmlFor={idCp} className="sr-only">Código postal</label>
          <Input
            id={idCp}
            name={idCp}
            autoComplete="postal-code"
            value={parts.cp}
            onChange={(e) => update({ cp: e.target.value.replace(/\D/g, "").slice(0, 5) })}
            placeholder="CP (5 dígitos)"
            inputMode="numeric"
            maxLength={5}
            className="rounded-xl border-border focus:border-blue-500/50"
          />
        </div>
      </div>
    </div>
  );
}
