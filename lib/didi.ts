/** Usuario DIDI: nutrióloga, acceso a la pestaña DIDI (planes nutricionales). */
export const DIDI_EMAIL = "didi@dietas.com";

export function isDidiUser(email: string | null | undefined): boolean {
  return (email ?? "").toLowerCase().trim() === DIDI_EMAIL;
}
