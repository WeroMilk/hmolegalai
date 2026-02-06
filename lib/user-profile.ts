export type UserRole = "cliente" | "abogado";

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  /** Solo abogados: si fue aprobado por admin */
  approved?: boolean;
  /** Abogados: datos personales y del despacho. Clientes: nombre para prellenar quejoso. */
  nombreCompleto?: string;
  /** Clientes: domicilio para prellenar en documentos de amparo. */
  domicilio?: string;
  /** Ciudad y estado para el pie del documento (ej: Hermosillo, Sonora). Opcional; se infiere del domicilio si no se indica. */
  ciudadPie?: string;
  nombreDespacho?: string;
  direccionDespacho?: string;
  telefonoDespacho?: string;
  /** Abogados: documentos de verificación (URLs en Storage) */
  fotoUrl?: string;
  ineUrl?: string;
  tituloUrl?: string;
  /** Fechas */
  createdAt?: { toMillis: () => number };
  approvedAt?: { toMillis: () => number };
}
