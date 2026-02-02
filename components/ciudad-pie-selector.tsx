"use client";

import { useMemo } from "react";
import { getEstadosOptions, getMunicipiosOptions } from "@/lib/mexico-locations";
import { DocumentSelect } from "@/components/ui/document-select";

interface CiudadPieSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
}

/** Parsea "Municipio, Estado" a { municipio, estado }. */
function parseCiudadPie(value: string): { municipio: string; estado: string } {
  const trimmed = (value || "").trim();
  if (!trimmed) return { municipio: "", estado: "" };
  const lastComma = trimmed.lastIndexOf(",");
  if (lastComma === -1) return { municipio: trimmed, estado: "" };
  return {
    municipio: trimmed.slice(0, lastComma).trim(),
    estado: trimmed.slice(lastComma + 1).trim(),
  };
}

export function CiudadPieSelector({ value, onChange, label, required }: CiudadPieSelectorProps) {
  const { estado, municipio } = useMemo(() => parseCiudadPie(value), [value]);
  const estadosOptions = useMemo(() => getEstadosOptions(), []);
  const municipiosOptions = useMemo(() => getMunicipiosOptions(estado), [estado]);

  const handleEstadoChange = (newEstado: string) => {
    onChange(newEstado || "");
  };

  const handleMunicipioChange = (newMunicipio: string) => {
    const newValue = estado && newMunicipio ? `${newMunicipio}, ${estado}` : estado || "";
    onChange(newValue);
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DocumentSelect
          value={estado}
          onChange={handleEstadoChange}
          options={estadosOptions}
          placeholder="Estado"
          aria-label="Estado"
        />
        <DocumentSelect
          value={municipio}
          onChange={handleMunicipioChange}
          options={municipiosOptions}
          placeholder="Municipio"
          disabled={!estado}
          aria-label="Municipio"
        />
      </div>
    </div>
  );
}
