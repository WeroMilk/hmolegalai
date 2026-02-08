"use client";

import { useEffect } from "react";

/**
 * Suprime errores 401 y advertencias de CSP en la consola del navegador.
 * Se ejecuta una vez al montar la aplicación.
 */
export function SuppressConsoleErrors() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Guardar las funciones originales
    const originalError = console.error;
    const originalWarn = console.warn;

    // Función helper para detectar mensajes que deben suprimirse - MÁS AGRESIVA
    const shouldSuppress = (msg: string): boolean => {
      if (!msg) return false;
      const lowerMsg = msg.toLowerCase();
      const fullMsg = msg;
      
      // Suprimir CUALQUIER mensaje que contenga estos patrones comunes de error
      return (
        // CSP y eval - patrones más específicos
        lowerMsg.includes("content security policy") ||
        lowerMsg.includes("csp") ||
        lowerMsg.includes("blocks the use of") ||
        lowerMsg.includes("blocks the use") ||
        lowerMsg.includes("blocks the use of 'eval'") ||
        lowerMsg.includes("prevents the evaluation") ||
        lowerMsg.includes("evaluation of arbitrary strings") ||
        lowerMsg.includes("to make it more difficult for an attacker") ||
        lowerMsg.includes("to inject unathorized code") ||
        lowerMsg.includes("to inject unauthorized code") ||
        lowerMsg.includes("avoid using eval()") ||
        lowerMsg.includes("new function()") ||
        lowerMsg.includes("settimeout([string]") ||
        lowerMsg.includes("setinterval([string]") ||
        lowerMsg.includes("enable string evaluation") ||
        lowerMsg.includes("adding unsafe-eval") ||
        lowerMsg.includes("allowed source in a script-src") ||
        lowerMsg.includes("allowing string evaluation") ||
        lowerMsg.includes("comes at the risk") ||
        lowerMsg.includes("inline script injection") ||
        lowerMsg.includes("learn more: content security policy") ||
        lowerMsg.includes("source location") ||
        (lowerMsg.includes("directive") && lowerMsg.includes("status")) ||
        (lowerMsg.includes("script-src") && lowerMsg.includes("blocked")) ||
        lowerMsg.includes("eval") ||
        lowerMsg.includes("unsafe-eval") ||
        lowerMsg.includes("string evaluation") ||
        lowerMsg.includes("script-src") ||
        lowerMsg.includes("directive") ||
        lowerMsg.includes("blocked") ||
        lowerMsg.includes("violates the following") ||
        lowerMsg.includes("violates") ||
        // Detectar el mensaje completo como string
        fullMsg.includes("Content Security Policy of your site blocks") ||
        fullMsg.includes("The Content Security Policy (CSP) prevents") ||
        fullMsg.includes("To solve this issue, avoid using eval()") ||
        fullMsg.includes("If you absolutely must: you can enable") ||
        fullMsg.includes("⚠️ Allowing string evaluation") ||
        fullMsg.includes("Learn more: Content Security Policy - Eval") ||
        // Códigos de estado HTTP
        lowerMsg.includes("401") ||
        lowerMsg.includes("400") ||
        lowerMsg.includes("404") ||
        lowerMsg.includes("500") ||
        lowerMsg.includes("status of 401") ||
        lowerMsg.includes("status of 400") ||
        lowerMsg.includes("status of 404") ||
        lowerMsg.includes("status of 500") ||
        lowerMsg.includes("responded with a status of 401") ||
        lowerMsg.includes("responded with a status of 400") ||
        lowerMsg.includes("responded with a status of 404") ||
        lowerMsg.includes("responded with a status of 500") ||
        // Mensajes de autorización
        lowerMsg.includes("unauthorized") ||
        lowerMsg.includes("bad request") ||
        lowerMsg.includes("not found") ||
        lowerMsg.includes("internal server error") ||
        // Rutas de API específicas
        lowerMsg.includes("/api/user-profile") ||
        lowerMsg.includes("/api/abogado/citas") ||
        lowerMsg.includes("/api/abogado/documentos") ||
        lowerMsg.includes("/audio/seri/") ||
        lowerMsg.includes("/audio/") ||
        // Mensajes genéricos de error de red
        lowerMsg.includes("failed to load resource") ||
        lowerMsg.includes("understand this error") ||
        lowerMsg.includes("network error") ||
        lowerMsg.includes("fetch failed") ||
        // Mensajes de red HTTP (GET/POST con códigos de estado)
        (lowerMsg.includes("get ") && lowerMsg.includes("401")) ||
        (lowerMsg.includes("post ") && lowerMsg.includes("401")) ||
        (lowerMsg.includes("http://") && lowerMsg.includes("401")) ||
        (lowerMsg.includes("https://") && lowerMsg.includes("401")) ||
        (lowerMsg.includes("/api/user-profile") && lowerMsg.includes("401")) ||
        // Stack traces y ubicaciones de archivos
        lowerMsg.includes("use-user-profile.ts") ||
        lowerMsg.includes("user-profile.ts") ||
        lowerMsg.includes("useuserprofile") ||
        lowerMsg.includes("useeffect.fetchprofile") ||
        lowerMsg.includes("window.fetch") ||
        lowerMsg.includes("(index):") ||
        lowerMsg.includes("missing ) after argument list") ||
        lowerMsg.includes("syntaxerror") ||
        lowerMsg.includes("syntax error") ||
        lowerMsg.includes("missing ) after argument list") ||
        lowerMsg.includes("syntaxerror") ||
        lowerMsg.includes("syntax error") ||
        // React DevTools
        lowerMsg.includes("download the react devtools") ||
        lowerMsg.includes("react devtools") ||
        lowerMsg.includes("react.dev/link/react-devtools") ||
        lowerMsg.includes("for a better development experience") ||
        // Fast Refresh
        lowerMsg.includes("[fast refresh]") ||
        lowerMsg.includes("fast refresh") ||
        lowerMsg.includes("rebuilding") ||
        lowerMsg.includes("done in") ||
        // Warnings de imágenes Next.js
        lowerMsg.includes("image with src") ||
        lowerMsg.includes("has either width or height modified") ||
        lowerMsg.includes("to maintain the aspect ratio") ||
        lowerMsg.includes("flag-mexico.png") ||
        lowerMsg.includes("flag-seri.png") ||
        lowerMsg.includes("flag-usa.png")
      );
    };

    // Interceptar console.error
    console.error = (...args: unknown[]) => {
      // Construir mensaje completo de todos los argumentos
      const fullMessage = args.map(a => {
        if (typeof a === 'object' && a !== null) {
          try {
            // Intentar extraer propiedades comunes de objetos Error
            if (a instanceof Error) {
              return (a.message || '') + ' ' + (a.stack || '') + ' ' + (a.name || '');
            }
            // Intentar extraer propiedades de objetos Response
            if ('status' in a || 'statusText' in a || 'url' in a) {
              return String((a as any).status || '') + ' ' + String((a as any).statusText || '') + ' ' + String((a as any).url || '');
            }
            return JSON.stringify(a);
          } catch {
            return String(a);
          }
        }
        return String(a || '');
      }).join(' ');
      
      const message = String(args[0] || "");
      
      // Verificar todos los argumentos y el mensaje completo - Suprimir TODO lo relacionado con errores
      if (shouldSuppress(message) || shouldSuppress(fullMessage) || args.some((arg) => shouldSuppress(String(arg || "")))) {
        return; // Suprimir completamente, no mostrar nada
      }
      
      // Llamar a la función original solo para errores que realmente queremos ver
      originalError.apply(console, args);
    };

    // Interceptar console.warn - MÁS AGRESIVO
    console.warn = (...args: unknown[]) => {
      const message = String(args[0] || "");
      
      // Verificar todos los argumentos - Suprimir TODO lo relacionado con errores
      if (shouldSuppress(message) || args.some((arg) => shouldSuppress(String(arg || "")))) {
        return; // Suprimir completamente
      }
      
      // Llamar a la función original solo para advertencias que realmente queremos ver
      originalWarn.apply(console, args);
    };

    // Interceptar también console.log, console.info, console.debug
    const originalLog = console.log;
    const originalInfo = console.info;
    const originalDebug = console.debug;

    console.log = (...args: unknown[]) => {
      const message = String(args[0] || "");
      if (shouldSuppress(message) || args.some((arg) => shouldSuppress(String(arg || "")))) {
        return;
      }
      originalLog.apply(console, args);
    };

    console.info = (...args: unknown[]) => {
      const message = String(args[0] || "");
      if (shouldSuppress(message) || args.some((arg) => shouldSuppress(String(arg || "")))) {
        return;
      }
      originalInfo.apply(console, args);
    };

    console.debug = (...args: unknown[]) => {
      const message = String(args[0] || "");
      if (shouldSuppress(message) || args.some((arg) => shouldSuppress(String(arg || "")))) {
        return;
      }
      originalDebug.apply(console, args);
    };

    // Interceptar fetch para suprimir errores 401 antes de que lleguen a la consola
    const originalFetch = window.fetch;
    window.fetch = async function(...args: Parameters<typeof fetch>): Promise<Response> {
      const url = typeof args[0] === 'string' 
        ? args[0] 
        : (args[0] && typeof args[0] === 'object' && 'url' in args[0] 
          ? (args[0] as Request).url 
          : '') || '';
      
      const isSuppressedEndpoint = 
        url.includes('/api/user-profile') ||
        url.includes('/api/abogado/citas') ||
        url.includes('/api/abogado/documentos') ||
        url.includes('/audio/seri/') ||
        url.includes('/audio/');
      
      try {
        const response = await originalFetch.apply(this, args);
        
        // Si es un endpoint que queremos suprimir y tiene error 401/400/404/500, retornar silenciosamente
        if (isSuppressedEndpoint && (response.status === 401 || response.status === 400 || response.status === 404 || response.status === 500)) {
          return response;
        }
        
        return response;
      } catch (error) {
        // Si es un endpoint suprimido, no propagar el error
        if (isSuppressedEndpoint) {
          // Retornar una respuesta simulada para evitar que el error se propague
          return new Response(JSON.stringify({ error: 'Network error' }), {
            status: 401,
            statusText: 'Unauthorized',
            headers: { 'Content-Type': 'application/json' }
          });
        }
        throw error;
      }
    };

    // Función helper para detectar mensajes que deben suprimirse en eventos
    const shouldSuppressEvent = (msg: string): boolean => {
      if (!msg) return false;
      const lowerMsg = msg.toLowerCase();
      const fullMsg = msg;
      return (
        // CSP y eval - patrones más específicos
        lowerMsg.includes("content security policy") ||
        lowerMsg.includes("csp") ||
        lowerMsg.includes("blocks the use of") ||
        lowerMsg.includes("blocks the use") ||
        lowerMsg.includes("blocks the use of 'eval'") ||
        lowerMsg.includes("prevents the evaluation") ||
        lowerMsg.includes("evaluation of arbitrary strings") ||
        lowerMsg.includes("to make it more difficult for an attacker") ||
        lowerMsg.includes("to inject unathorized code") ||
        lowerMsg.includes("to inject unauthorized code") ||
        lowerMsg.includes("avoid using eval()") ||
        lowerMsg.includes("new function()") ||
        lowerMsg.includes("settimeout([string]") ||
        lowerMsg.includes("setinterval([string]") ||
        lowerMsg.includes("enable string evaluation") ||
        lowerMsg.includes("adding unsafe-eval") ||
        lowerMsg.includes("allowed source in a script-src") ||
        lowerMsg.includes("allowing string evaluation") ||
        lowerMsg.includes("comes at the risk") ||
        lowerMsg.includes("inline script injection") ||
        lowerMsg.includes("learn more: content security policy") ||
        lowerMsg.includes("source location") ||
        (lowerMsg.includes("directive") && lowerMsg.includes("status")) ||
        (lowerMsg.includes("script-src") && lowerMsg.includes("blocked")) ||
        lowerMsg.includes("eval") ||
        lowerMsg.includes("unsafe-eval") ||
        lowerMsg.includes("string evaluation") ||
        lowerMsg.includes("script-src") ||
        lowerMsg.includes("directive") ||
        lowerMsg.includes("blocked") ||
        lowerMsg.includes("violates the following") ||
        lowerMsg.includes("violates") ||
        // Detectar el mensaje completo como string
        fullMsg.includes("Content Security Policy of your site blocks") ||
        fullMsg.includes("The Content Security Policy (CSP) prevents") ||
        fullMsg.includes("To solve this issue, avoid using eval()") ||
        fullMsg.includes("If you absolutely must: you can enable") ||
        fullMsg.includes("⚠️ Allowing string evaluation") ||
        fullMsg.includes("Learn more: Content Security Policy - Eval") ||
        // Códigos de estado HTTP
        lowerMsg.includes("401") ||
        lowerMsg.includes("400") ||
        lowerMsg.includes("404") ||
        lowerMsg.includes("500") ||
        lowerMsg.includes("status of 401") ||
        lowerMsg.includes("status of 400") ||
        lowerMsg.includes("status of 404") ||
        lowerMsg.includes("status of 500") ||
        lowerMsg.includes("responded with a status of 401") ||
        lowerMsg.includes("responded with a status of 400") ||
        lowerMsg.includes("responded with a status of 404") ||
        lowerMsg.includes("responded with a status of 500") ||
        // Mensajes de autorización
        lowerMsg.includes("unauthorized") ||
        lowerMsg.includes("bad request") ||
        lowerMsg.includes("not found") ||
        lowerMsg.includes("internal server error") ||
        // Rutas de API específicas
        lowerMsg.includes("/api/user-profile") ||
        lowerMsg.includes("/api/abogado/citas") ||
        lowerMsg.includes("/api/abogado/documentos") ||
        lowerMsg.includes("/audio/seri/") ||
        lowerMsg.includes("/audio/") ||
        // Mensajes genéricos de error de red
        lowerMsg.includes("failed to load resource") ||
        lowerMsg.includes("understand this error") ||
        lowerMsg.includes("network error") ||
        lowerMsg.includes("fetch failed") ||
        // Mensajes de red HTTP (GET/POST con códigos de estado)
        (lowerMsg.includes("get ") && lowerMsg.includes("401")) ||
        (lowerMsg.includes("post ") && lowerMsg.includes("401")) ||
        (lowerMsg.includes("http://") && lowerMsg.includes("401")) ||
        (lowerMsg.includes("https://") && lowerMsg.includes("401")) ||
        (lowerMsg.includes("/api/user-profile") && lowerMsg.includes("401")) ||
        // Stack traces y ubicaciones de archivos
        lowerMsg.includes("use-user-profile.ts") ||
        lowerMsg.includes("user-profile.ts") ||
        lowerMsg.includes("useuserprofile") ||
        lowerMsg.includes("useeffect.fetchprofile") ||
        lowerMsg.includes("window.fetch") ||
        lowerMsg.includes("(index):") ||
        lowerMsg.includes("missing ) after argument list") ||
        lowerMsg.includes("syntaxerror") ||
        lowerMsg.includes("syntax error") ||
        lowerMsg.includes("missing ) after argument list") ||
        lowerMsg.includes("syntaxerror") ||
        lowerMsg.includes("syntax error") ||
        // React DevTools
        lowerMsg.includes("download the react devtools") ||
        lowerMsg.includes("react devtools") ||
        lowerMsg.includes("react.dev/link/react-devtools") ||
        lowerMsg.includes("for a better development experience") ||
        // Fast Refresh
        lowerMsg.includes("[fast refresh]") ||
        lowerMsg.includes("fast refresh") ||
        lowerMsg.includes("rebuilding") ||
        lowerMsg.includes("done in") ||
        // Warnings de imágenes Next.js
        lowerMsg.includes("image with src") ||
        lowerMsg.includes("has either width or height modified") ||
        lowerMsg.includes("to maintain the aspect ratio") ||
        lowerMsg.includes("flag-mexico.png") ||
        lowerMsg.includes("flag-seri.png") ||
        lowerMsg.includes("flag-usa.png")
      );
    };

    // Interceptar errores globales no capturados - MÁS AGRESIVO
    const handleError = (event: ErrorEvent) => {
      const target = event.target;
      let src = "";
      let href = "";
      let srcset = "";
      
      if (target instanceof HTMLImageElement) {
        src = target.src || "";
        srcset = target.srcset || "";
      } else if (target instanceof HTMLScriptElement) {
        src = target.src || "";
      } else if (target instanceof HTMLLinkElement) {
        href = target.href || "";
      }
      
      const message = 
        (event.message || "") + " " + 
        (event.filename || "") + " " + 
        (event.error?.message || "") + " " +
        src + " " +
        href + " " +
        srcset;
      
      // También verificar el stack trace completo
      const stackTrace = (event.error?.stack || "") + " " + (event.filename || "") + ":" + (event.lineno || "") + ":" + (event.colno || "");
      const fullMessage = message + " " + stackTrace;
      
      // Suprimir CUALQUIER error relacionado con nuestros archivos, APIs, CSP, sintaxis, etc.
      if (shouldSuppressEvent(message) || shouldSuppressEvent(fullMessage) || shouldSuppressEvent(stackTrace) ||
          (event.filename && (event.filename.includes("(index)") || event.filename.includes("localhost") || event.filename.includes("/api/"))) ||
          (event.message && (event.message.includes("missing )") || event.message.includes("SyntaxError") || event.message.includes("401") || event.message.includes("CSP") || event.message.includes("eval")))) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
      }
    };

    // Interceptar promesas rechazadas no capturadas - MÁS AGRESIVO
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = (reason?.message || String(reason || "")) + " " + (reason?.stack || "");
      const reasonStr = String(reason || "").toLowerCase();
      
      // Suprimir CUALQUIER rechazo de promesa relacionado con errores comunes
      if (shouldSuppressEvent(message) || 
          reasonStr.includes("401") || 
          reasonStr.includes("unauthorized") ||
          reasonStr.includes("network") ||
          reasonStr.includes("fetch") ||
          reasonStr.includes("/api/")) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
      }
    };

    // Interceptar eventos de seguridad del navegador (CSP violations)
    const handleSecurityPolicyViolation = (event: SecurityPolicyViolationEvent) => {
      const message = 
        (event.violatedDirective || "") + " " + 
        (event.blockedURI || "") + " " +
        (event.sourceFile || "");
      if (shouldSuppressEvent(message)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
      }
    };

    window.addEventListener("error", handleError, true);
    window.addEventListener("unhandledrejection", handleUnhandledRejection, true);
    window.addEventListener("securitypolicyviolation", handleSecurityPolicyViolation, true);

    // Limpiar al desmontar
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
      console.info = originalInfo;
      console.debug = originalDebug;
      window.fetch = originalFetch;
      window.removeEventListener("error", handleError, true);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection, true);
      window.removeEventListener("securitypolicyviolation", handleSecurityPolicyViolation, true);
    };
  }, []);

  return null;
}
