# Mejoras en el Sistema de Audio Comca'ac

## Resumen de Mejoras Implementadas

Se ha mejorado significativamente el sistema de reproducción de audio para la lengua comca'ac (cmiique iitom), asegurando que el flujo completo de los 3 idiomas (comca'ac, español, inglés) funcione de manera óptima tanto en escritura, lectura como en audio.

## Cambios Principales

### 1. Nuevo Endpoint API para TTS Comca'ac (`/api/seri-tts`)

- **Ubicación**: `app/api/seri-tts/route.ts`
- **Funcionalidad**: Genera audio de alta calidad usando OpenAI TTS
- **Características**:
  - Modelo `tts-1-hd` para mejor calidad
  - Voz `nova` optimizada para idiomas no estándar
  - Velocidad ajustada a 0.85 para mejor comprensión del acento comca'ac
  - Cache de 1 año para optimizar rendimiento

### 2. Sistema de Audio Mejorado (`lib/seri-audio.ts`)

**Estrategia de 3 niveles**:

1. **Audio pregrabado** (prioridad máxima)
   - Busca archivos MP3 en `/public/audio/seri/{id}.mp3`
   - Voz auténtica de hablantes nativos comca'ac

2. **OpenAI TTS** (segunda opción)
   - Genera audio dinámico usando el endpoint `/api/seri-tts`
   - Mejor pronunciación que Web Speech API
   - Aproximación más cercana al acento comca'ac

3. **Web Speech API** (fallback)
   - Último recurso si fallan las opciones anteriores
   - Usa voz en español mexicano como aproximación

### 3. Utilidades de Audio Unificadas (`lib/audio-utils.ts`)

- Nueva función `speakText()` que maneja los 3 idiomas de forma unificada
- Selección automática de la mejor voz disponible para cada idioma
- Soporte mejorado para español (es-MX) e inglés (en-US)
- Manejo robusto de carga asíncrona de voces en navegadores

### 4. Mejoras en Componentes

#### Traductor (`app/traductor/page.tsx`)
- Integración con el nuevo sistema de audio mejorado
- Reproducción automática con acento correcto según el idioma de destino

#### Voice Translator (`components/voice-translator.tsx`)
- Botón de reproducción mejorado con mejor UX
- Soporte completo para los 3 idiomas

## Flujo Completo de los 3 Idiomas

### Escritura
- ✅ Soporte completo para escribir en comca'ac, español e inglés
- ✅ Teclado de frases comca'ac con categorías organizadas
- ✅ Traducción bidireccional entre los 3 idiomas

### Lectura
- ✅ Visualización correcta de texto en los 3 idiomas
- ✅ Traducciones en tiempo real
- ✅ Sugerencias del corpus de traducciones existentes

### Audio
- ✅ **Comca'ac**: Audio pregrabado → OpenAI TTS → Web Speech API (fallback)
- ✅ **Español**: Web Speech API con voz mexicana preferida
- ✅ **Inglés**: Web Speech API con voz estadounidense preferida

## Configuración Requerida

### Variables de Entorno

Asegúrate de tener configurada la siguiente variable:

```env
OPENAI_API_KEY=tu_clave_openai
```

Esta clave es necesaria para:
- Generación de audio TTS comca'ac
- Traducciones entre idiomas
- Transcripción de voz comca'ac

## Uso del Sistema Mejorado

### Para Desarrolladores

```typescript
// Reproducir texto comca'ac
import { playSeriText } from "@/lib/seri-audio";
await playSeriText("Ziix hac");

// Reproducir texto en cualquier idioma
import { speakText } from "@/lib/audio-utils";
await speakText("Hola mundo", "es");
await speakText("Hello world", "en");
await speakText("Ziix hac", "seri");
```

### Para Usuarios

1. **Escribir en comca'ac**: Usa el teclado de frases o escribe directamente
2. **Escuchar comca'ac**: Haz clic en el botón de audio (altavoz) junto al texto
3. **Traducir**: Selecciona el par de idiomas y haz clic en "Traducir"
4. **Escuchar traducción**: Haz clic en el botón de audio junto a la traducción

## Notas Técnicas

### Limitaciones Conocidas

1. **OpenAI TTS**: No tiene soporte nativo para comca'ac, pero proporciona mejor aproximación que Web Speech API
2. **Audio pregrabado**: La mejor calidad se obtiene con archivos MP3 grabados por hablantes nativos
3. **Navegadores**: Algunos navegadores pueden requerir interacción del usuario antes de reproducir audio

### Optimizaciones

- Cache de audio generado por OpenAI TTS (1 año)
- Limpieza automática de blob URLs después de reproducir
- Activación automática de AudioContext en iOS
- Manejo robusto de errores en todos los niveles

## Próximos Pasos Recomendados

1. **Grabar más audio pregrabado**: Agregar más archivos MP3 en `/public/audio/seri/` con voces auténticas
2. **Entrenar modelo personalizado**: Considerar entrenar un modelo TTS específico para comca'ac usando ElevenLabs u otra plataforma
3. **Mejorar pronunciación**: Ajustar el prompt de OpenAI TTS con ejemplos fonéticos específicos de comca'ac

## Archivos Modificados/Creados

### Nuevos Archivos
- `app/api/seri-tts/route.ts` - Endpoint API para TTS comca'ac
- `lib/audio-utils.ts` - Utilidades unificadas de audio
- `MEJORAS_AUDIO_COMCAAC.md` - Esta documentación

### Archivos Modificados
- `lib/seri-audio.ts` - Sistema mejorado de audio comca'ac
- `app/traductor/page.tsx` - Integración con nuevo sistema de audio
- `components/voice-translator.tsx` - Mejoras en reproducción de audio

## Soporte

Para problemas o preguntas sobre el sistema de audio, consulta:
- Documentación de OpenAI TTS: https://platform.openai.com/docs/guides/text-to-speech
- Documentación de Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis
