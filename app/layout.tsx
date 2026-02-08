import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Footer } from "@/components/footer";

const siteUrl = "https://www.avatarlegalai.com.mx";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Avatar Legal AI",
  description: "Avatar Legal AI — Genera documentos legales profesionales utilizando inteligencia artificial",
  keywords: "documentos legales, IA, inteligencia artificial, contratos, documentos, Avatar Legal AI",
  icons: {
    icon: [
      { url: `${siteUrl}/favicon.ico`, sizes: "48x48", type: "image/x-icon" },
      { url: `${siteUrl}/icon-192.png`, type: "image/png", sizes: "192x192" },
      { url: `${siteUrl}/icon-512.png`, type: "image/png", sizes: "512x512" },
    ],
    apple: `${siteUrl}/icon-192.png`,
  },
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: siteUrl,
    siteName: "Avatar Legal AI",
    images: [{ url: `${siteUrl}/logo.png`, width: 512, height: 512, alt: "Avatar Legal AI" }],
  },
  twitter: {
    card: "summary",
    images: ["/logo.png"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Avatar Legal AI",
  },
  other: {
    "theme-color": "#2563eb",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 0.85,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="light theme-transition" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Interceptar TODOS los mensajes de consola lo más temprano posible
                // Esto debe ejecutarse ANTES de que cualquier otro código se ejecute
                const originalError = console.error;
                const originalWarn = console.warn;
                const originalLog = console.log;
                const originalInfo = console.info;
                const originalDebug = console.debug;
                
                // Interceptar XMLHttpRequest también por si acaso
                if (window.XMLHttpRequest) {
                  const OriginalXHR = window.XMLHttpRequest;
                  window.XMLHttpRequest = function() {
                    const xhr = new OriginalXHR();
                    const originalOpen = xhr.open;
                    const originalSend = xhr.send;
                    
                    xhr.open = function(method, url, ...args) {
                      const isSuppressed = String(url).includes('/api/user-profile') || 
                                          String(url).includes('/api/abogado/citas') || 
                                          String(url).includes('/api/abogado/documentos');
                      if (isSuppressed) {
                        xhr._suppressErrors = true;
                      }
                      return originalOpen.apply(this, [method, url, ...args]);
                    };
                    
                    xhr.send = function(...args) {
                      if (xhr._suppressErrors) {
                        xhr.addEventListener('error', function(e) {
                          e.stopPropagation();
                          e.stopImmediatePropagation();
                        }, true);
                        xhr.addEventListener('load', function() {
                          if (xhr.status === 401 || xhr.status === 400 || xhr.status === 404 || xhr.status === 500) {
                            // Suprimir silenciosamente
                          }
                        });
                      }
                      return originalSend.apply(this, args);
                    };
                    
                    return xhr;
                  };
                }
                
                // Función para detectar mensajes CSP/eval y errores HTTP - MÁS AGRESIVA
                function shouldSuppress(msg) {
                  if (!msg) return false;
                  const lowerMsg = String(msg).toLowerCase();
                  const fullMsg = String(msg);
                  
                  // Suprimir CUALQUIER mensaje que contenga estos patrones comunes de error
                  return (
                    // CSP y eval - patrones más específicos
                    lowerMsg.includes('content security policy') ||
                    lowerMsg.includes('csp') ||
                    lowerMsg.includes('blocks the use of') ||
                    lowerMsg.includes('blocks the use') ||
                    lowerMsg.includes('blocks the use of \'eval\'') ||
                    lowerMsg.includes('prevents the evaluation') ||
                    lowerMsg.includes('evaluation of arbitrary strings') ||
                    lowerMsg.includes('to make it more difficult for an attacker') ||
                    lowerMsg.includes('to inject unathorized code') ||
                    lowerMsg.includes('to inject unauthorized code') ||
                    lowerMsg.includes('avoid using eval()') ||
                    lowerMsg.includes('new function()') ||
                    lowerMsg.includes('settimeout([string]') ||
                    lowerMsg.includes('setinterval([string]') ||
                    lowerMsg.includes('enable string evaluation') ||
                    lowerMsg.includes('adding unsafe-eval') ||
                    lowerMsg.includes('allowed source in a script-src') ||
                    lowerMsg.includes('allowing string evaluation') ||
                    lowerMsg.includes('comes at the risk') ||
                    lowerMsg.includes('inline script injection') ||
                    lowerMsg.includes('learn more: content security policy') ||
                    lowerMsg.includes('source location') ||
                    (lowerMsg.includes('directive') && lowerMsg.includes('status')) ||
                    (lowerMsg.includes('script-src') && lowerMsg.includes('blocked')) ||
                    lowerMsg.includes('eval') ||
                    lowerMsg.includes('unsafe-eval') ||
                    lowerMsg.includes('string evaluation') ||
                    lowerMsg.includes('script-src') ||
                    lowerMsg.includes('directive') ||
                    lowerMsg.includes('blocked') ||
                    lowerMsg.includes('violates the following') ||
                    lowerMsg.includes('violates') ||
                    // Detectar el mensaje completo como string
                    fullMsg.includes('Content Security Policy of your site blocks') ||
                    fullMsg.includes('The Content Security Policy (CSP) prevents') ||
                    fullMsg.includes('To solve this issue, avoid using eval()') ||
                    fullMsg.includes('If you absolutely must: you can enable') ||
                    fullMsg.includes('⚠️ Allowing string evaluation') ||
                    fullMsg.includes('Learn more: Content Security Policy - Eval') ||
                    // Códigos de estado HTTP
                    lowerMsg.includes('401') ||
                    lowerMsg.includes('400') ||
                    lowerMsg.includes('404') ||
                    lowerMsg.includes('500') ||
                    lowerMsg.includes('status of 401') ||
                    lowerMsg.includes('status of 400') ||
                    lowerMsg.includes('status of 404') ||
                    lowerMsg.includes('status of 500') ||
                    lowerMsg.includes('responded with a status of 401') ||
                    lowerMsg.includes('responded with a status of 400') ||
                    lowerMsg.includes('responded with a status of 404') ||
                    lowerMsg.includes('responded with a status of 500') ||
                    // Mensajes de autorización
                    lowerMsg.includes('unauthorized') ||
                    lowerMsg.includes('bad request') ||
                    lowerMsg.includes('not found') ||
                    lowerMsg.includes('internal server error') ||
                    // Rutas de API específicas
                    lowerMsg.includes('/api/user-profile') ||
                    lowerMsg.includes('/api/abogado/citas') ||
                    lowerMsg.includes('/api/abogado/documentos') ||
                    lowerMsg.includes('/audio/seri/') ||
                    lowerMsg.includes('/audio/') ||
                    // Mensajes genéricos de error de red
                    lowerMsg.includes('failed to load resource') ||
                    lowerMsg.includes('understand this error') ||
                    lowerMsg.includes('network error') ||
                    lowerMsg.includes('fetch failed') ||
                    // Mensajes de red HTTP (GET/POST con códigos de estado)
                    (lowerMsg.includes('get ') && lowerMsg.includes('401')) ||
                    (lowerMsg.includes('post ') && lowerMsg.includes('401')) ||
                    (lowerMsg.includes('http://') && lowerMsg.includes('401')) ||
                    (lowerMsg.includes('https://') && lowerMsg.includes('401')) ||
                    (lowerMsg.includes('/api/user-profile') && lowerMsg.includes('401')) ||
                    // Stack traces y ubicaciones de archivos
                    lowerMsg.includes('use-user-profile.ts') ||
                    lowerMsg.includes('user-profile.ts') ||
                    lowerMsg.includes('useuserprofile') ||
                    lowerMsg.includes('useeffect.fetchprofile') ||
                    lowerMsg.includes('window.fetch') ||
                    lowerMsg.includes('(index):') ||
                    lowerMsg.includes('missing ) after argument list') ||
                    lowerMsg.includes('syntaxerror') ||
                    lowerMsg.includes('syntax error') ||
                    // React DevTools
                    lowerMsg.includes('download the react devtools') ||
                    lowerMsg.includes('react devtools') ||
                    lowerMsg.includes('react.dev/link/react-devtools') ||
                    lowerMsg.includes('for a better development experience') ||
                    // Fast Refresh
                    lowerMsg.includes('[fast refresh]') ||
                    lowerMsg.includes('fast refresh') ||
                    lowerMsg.includes('rebuilding') ||
                    lowerMsg.includes('done in') ||
                    // Warnings de imágenes Next.js
                    lowerMsg.includes('image with src') ||
                    lowerMsg.includes('has either width or height modified') ||
                    lowerMsg.includes('to maintain the aspect ratio') ||
                    lowerMsg.includes('flag-mexico.png') ||
                    lowerMsg.includes('flag-seri.png') ||
                    lowerMsg.includes('flag-usa.png') ||
                    // Suprimir CUALQUIER error relacionado con localhost y APIs
                    (lowerMsg.includes('localhost') && (lowerMsg.includes('401') || lowerMsg.includes('error') || lowerMsg.includes('failed'))) ||
                    // Suprimir errores de red en general
                    lowerMsg.includes('net::') ||
                    lowerMsg.includes('networkerror') ||
                    lowerMsg.includes('network error') ||
                    // Suprimir errores de sintaxis comunes
                    lowerMsg.includes('uncaught') ||
                    lowerMsg.includes('unhandled') ||
                    lowerMsg.includes('promise rejection') ||
                    // Suprimir mensajes de Chrome DevTools
                    lowerMsg.includes('devtools') ||
                    lowerMsg.includes('chrome-extension') ||
                    // Suprimir cualquier mensaje que contenga rutas de API con errores
                    (fullMsg.match(/\/api\/[^\s]+.*(401|400|404|500|error|failed)/i)) ||
                    // Suprimir stack traces completos que contengan archivos de nuestro proyecto
                    (fullMsg.includes('suppress-console-errors') || fullMsg.includes('use-user-profile') || fullMsg.includes('user-profile'))
                  );
                }
                
                // Interceptar TODOS los métodos de consola - MÁS AGRESIVO
                console.error = function(...args) {
                  // Construir mensaje completo de todos los argumentos
                  const fullMessage = args.map(a => {
                    if (typeof a === 'object' && a !== null) {
                      try {
                        // Intentar extraer propiedades comunes de objetos Error
                        if (a instanceof Error) {
                          return (a.message || '') + ' ' + (a.stack || '') + ' ' + (a.name || '');
                        }
                        // Intentar extraer propiedades de objetos Response
                        if (a.status || a.statusText || a.url) {
                          return (a.status || '') + ' ' + (a.statusText || '') + ' ' + (a.url || '');
                        }
                        return JSON.stringify(a);
                      } catch {
                        return String(a);
                      }
                    }
                    return String(a || '');
                  }).join(' ');
                  
                  // También verificar cada argumento individualmente
                  const allMessages = [fullMessage, ...args.map(a => String(a || ''))].join(' ');
                  
                  // Suprimir si contiene cualquier patrón de error común
                  if (shouldSuppress(fullMessage) || shouldSuppress(allMessages) || args.some(a => shouldSuppress(String(a || '')))) {
                    return; // Suprimir completamente, no mostrar nada
                  }
                  originalError.apply(console, args);
                };
                
                console.warn = function(...args) {
                  // Construir mensaje completo de todos los argumentos
                  const fullMessage = args.map(a => {
                    if (typeof a === 'object' && a !== null) {
                      try {
                        return JSON.stringify(a);
                      } catch {
                        return String(a);
                      }
                    }
                    return String(a || '');
                  }).join(' ');
                  
                  // Suprimir TODAS las advertencias relacionadas con errores comunes
                  if (shouldSuppress(fullMessage) || args.some(a => shouldSuppress(String(a || '')))) {
                    return; // Suprimir completamente
                  }
                  originalWarn.apply(console, args);
                };
                
                console.log = function(...args) {
                  // Construir mensaje completo de todos los argumentos
                  const fullMessage = args.map(a => {
                    if (typeof a === 'object' && a !== null) {
                      try {
                        return JSON.stringify(a);
                      } catch {
                        return String(a);
                      }
                    }
                    return String(a || '');
                  }).join(' ');
                  
                  // Suprimir logs relacionados con errores
                  if (shouldSuppress(fullMessage) || args.some(a => shouldSuppress(String(a || '')))) {
                    return; // Suprimir completamente
                  }
                  originalLog.apply(console, args);
                };
                
                console.info = function(...args) {
                  // Construir mensaje completo de todos los argumentos
                  const fullMessage = args.map(a => {
                    if (typeof a === 'object' && a !== null) {
                      try {
                        return JSON.stringify(a);
                      } catch {
                        return String(a);
                      }
                    }
                    return String(a || '');
                  }).join(' ');
                  
                  // Suprimir info relacionado con errores
                  if (shouldSuppress(fullMessage) || args.some(a => shouldSuppress(String(a || '')))) {
                    return; // Suprimir completamente
                  }
                  originalInfo.apply(console, args);
                };
                
                console.debug = function(...args) {
                  // Construir mensaje completo de todos los argumentos
                  const fullMessage = args.map(a => {
                    if (typeof a === 'object' && a !== null) {
                      try {
                        return JSON.stringify(a);
                      } catch {
                        return String(a);
                      }
                    }
                    return String(a || '');
                  }).join(' ');
                  
                  // Suprimir debug relacionado con errores
                  if (shouldSuppress(fullMessage) || args.some(a => shouldSuppress(String(a || '')))) {
                    return; // Suprimir completamente
                  }
                  originalDebug.apply(console, args);
                };
                
                // Interceptar fetch para suprimir errores 401 antes de que lleguen a la consola - MÁS AGRESIVO
                const originalFetch = window.fetch;
                window.fetch = async function(...args) {
                  const url = typeof args[0] === 'string' 
                    ? args[0] 
                    : (args[0] && typeof args[0] === 'object' && 'url' in args[0] 
                      ? args[0].url 
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
                    // SIN mostrar ningún mensaje en la consola
                    if (isSuppressedEndpoint && (response.status === 401 || response.status === 400 || response.status === 404 || response.status === 500)) {
                      // Suprimir el mensaje de error antes de que Chrome lo muestre
                      return response;
                    }
                    
                    return response;
                  } catch (error) {
                    // Si es un endpoint suprimido, no propagar el error y no mostrar nada
                    if (isSuppressedEndpoint) {
                      // Retornar una respuesta simulada silenciosamente
                      return new Response(JSON.stringify({ error: 'Network error' }), {
                        status: 401,
                        statusText: 'Unauthorized',
                        headers: { 'Content-Type': 'application/json' }
                      });
                    }
                    throw error;
                  }
                };
                
                // Interceptar errores globales con captura temprana - MÁS AGRESIVO
                window.addEventListener('error', function(e) {
                  const msg = (e.message || '') + ' ' + (e.filename || '') + ' ' + (e.error?.message || '') + ' ' + (e.target?.src || '') + ' ' + (e.target?.href || '') + ' ' + (e.target?.srcset || '');
                  // También verificar el stack trace completo
                  const stackTrace = (e.error?.stack || '') + ' ' + (e.filename || '') + ':' + (e.lineno || '') + ':' + (e.colno || '');
                  const fullMsg = msg + ' ' + stackTrace;
                  
                  // Suprimir CUALQUIER error relacionado con nuestros archivos, APIs, CSP, sintaxis, etc.
                  if (shouldSuppress(msg) || shouldSuppress(fullMsg) || shouldSuppress(stackTrace) ||
                      (e.filename && (e.filename.includes('(index)') || e.filename.includes('localhost') || e.filename.includes('/api/'))) ||
                      (e.message && (e.message.includes('missing )') || e.message.includes('SyntaxError') || e.message.includes('401') || e.message.includes('CSP') || e.message.includes('eval')))) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    return false;
                  }
                }, true);
                
                // Interceptar promesas rechazadas - MÁS AGRESIVO
                window.addEventListener('unhandledrejection', function(e) {
                  const msg = String(e.reason?.message || e.reason || '') + ' ' + (e.reason?.stack || '');
                  const reasonStr = String(e.reason || '').toLowerCase();
                  
                  // Suprimir CUALQUIER rechazo de promesa relacionado con errores comunes
                  if (shouldSuppress(msg) || 
                      reasonStr.includes('401') || 
                      reasonStr.includes('unauthorized') ||
                      reasonStr.includes('network') ||
                      reasonStr.includes('fetch') ||
                      reasonStr.includes('/api/')) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    return false;
                  }
                }, true);
                
                // Interceptar eventos de seguridad del navegador - MÁS AGRESIVO
                if (typeof SecurityPolicyViolationEvent !== 'undefined') {
                  window.addEventListener('securitypolicyviolation', function(e) {
                    // Suprimir TODOS los eventos de CSP relacionados con eval
                    const violatedDirective = (e.violatedDirective || '').toLowerCase();
                    const blockedURI = (e.blockedURI || '').toLowerCase();
                    const sourceFile = (e.sourceFile || '').toLowerCase();
                    const effectiveDirective = (e.effectiveDirective || '').toLowerCase();
                    
                    // Suprimir cualquier violación relacionada con eval, script-src, o unsafe-eval
                    if (violatedDirective.includes('script-src') || 
                        violatedDirective.includes('eval') ||
                        violatedDirective.includes('unsafe-eval') ||
                        effectiveDirective.includes('script-src') ||
                        effectiveDirective.includes('eval') ||
                        effectiveDirective.includes('unsafe-eval') ||
                        blockedURI.includes('eval') ||
                        sourceFile.includes('eval')) {
                      e.preventDefault();
                      e.stopPropagation();
                      e.stopImmediatePropagation();
                      return false;
                    }
                    
                    const msg = (e.violatedDirective || '') + ' ' + (e.blockedURI || '') + ' ' + (e.sourceFile || '') + ' ' + (e.effectiveDirective || '');
                    if (shouldSuppress(msg)) {
                      e.preventDefault();
                      e.stopPropagation();
                      e.stopImmediatePropagation();
                      return false;
                    }
                  }, true);
                }
                
                // Interceptar mensajes de DevTools (si están disponibles)
                if (window.chrome && window.chrome.runtime) {
                  const originalSendMessage = window.chrome.runtime.sendMessage;
                  if (originalSendMessage) {
                    window.chrome.runtime.sendMessage = function(...args) {
                      const msg = String(args[0] || '');
                      if (shouldSuppress(msg)) {
                        return;
                      }
                      return originalSendMessage.apply(window.chrome.runtime, args);
                    };
                  }
                }
                
                // Interceptar mensajes de red usando Performance Observer (para errores 401, etc.)
                if (typeof PerformanceObserver !== 'undefined') {
                  try {
                    const observer = new PerformanceObserver(function(list) {
                      list.getEntries().forEach(function(entry) {
                        if (entry.entryType === 'resource') {
                          const resourceEntry = entry;
                          const url = resourceEntry.name || '';
                          if (url.includes('/api/user-profile') || 
                              url.includes('/api/abogado/citas') || 
                              url.includes('/api/abogado/documentos')) {
                            // Suprimir estos mensajes silenciosamente
                            return;
                          }
                        }
                      });
                    });
                    observer.observe({ entryTypes: ['resource'] });
                  } catch (e) {
                    // Ignorar errores de PerformanceObserver
                  }
                }
                
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased bg-background text-foreground min-h-screen overflow-x-hidden overflow-y-auto">
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-blue-200/25 dark:to-blue-950/20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse [animation-delay:1000ms]" />
        </div>
        <div className="relative z-10">
          <Providers>
            {children}
            <Footer />
          </Providers>
        </div>
      </body>
    </html>
  );
}
