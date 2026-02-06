/** Usuarios demo para pruebas. Se auto-crean en Firebase si no existen. */

import { DIDI_EMAIL } from "./didi";
import { SUPERUSER_EMAIL, SUPERUSER_PASSWORD } from "./superuser";

export const DEMO_ABOGADO_EMAIL = "abogado@avatar.com";
export const DEMO_ABOGADO_PASSWORD = "abogado123";

export const DEMO_CLIENTE_EMAIL = "cliente@avatar.com";
export const DEMO_CLIENTE_PASSWORD = "cliente123";

export const DEMO_DIDI_PASSWORD = "didi123";

/** Credenciales que se auto-crean al hacer signIn si el usuario no existe */
export const DEMO_AUTO_CREATE: Array<{ email: string; password: string }> = [
  { email: SUPERUSER_EMAIL, password: SUPERUSER_PASSWORD },
  { email: DEMO_ABOGADO_EMAIL, password: DEMO_ABOGADO_PASSWORD },
  { email: DEMO_CLIENTE_EMAIL, password: DEMO_CLIENTE_PASSWORD },
  { email: DIDI_EMAIL, password: DEMO_DIDI_PASSWORD },
];

export function isDemoAbogado(email: string | null | undefined): boolean {
  return (email ?? "").trim().toLowerCase() === DEMO_ABOGADO_EMAIL;
}

export function isDemoCliente(email: string | null | undefined): boolean {
  return (email ?? "").trim().toLowerCase() === DEMO_CLIENTE_EMAIL;
}
