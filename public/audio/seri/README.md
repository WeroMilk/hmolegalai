# Audio en Cmiique Iitom (Seri)

Para que la voz que reproduce cada ícono del teclado suene en **Seri auténtico** (Comcaac), coloca aquí archivos MP3 grabados por hablantes nativos.

## Cómo agregar grabaciones

Cada archivo debe nombrarse con el ID de la frase, por ejemplo:

- `sit-1.mp3` → "Ziix hac" (Mi situación)
- `sit-2.mp3` → "Ziix hac quih ano coti" (Quiero demandar)
- `doc-1.mp3` → "Ziix hapáctim" (Documento)
- etc.

Ver `lib/seri-phrases.ts` para la lista completa de IDs y frases.

## IDs de frases

| ID | Seri | Español |
|----|------|---------|
| sit-1 | Ziix hac | Mi situación |
| sit-2 | Ziix hac quih ano coti | Quiero demandar |
| sit-3 | Hant ihiip hac | Tengo un problema |
| sit-4 | Haxt quih anxö iti | Alguien me hizo daño |
| aut-1 | Hast | Autoridad |
| aut-2 | Hast cöpaac | Juez |
| aut-3 | Ziix quixaaza | Policía / soldado |
| aut-4 | Haxt | Persona |
| doc-1 | Ziix hapáctim | Documento |
| doc-2 | Xaap iti | Firmar |
| doc-3 | Ziix hac xaap iti | Yo firmo |
| doc-4 | Cöihcapxöt ziix | Contrato |
| ayu-1 | Haxt quih ooca | Abogado |
| ayu-2 | Quih ano coti | Pedir / demandar |
| ayu-3 | Ziix hac quih ano coti ziix hapáctim | Quiero un documento |
| jus-1 | Quih iti capxöt | Justicia |
| jus-2 | Cöihyáax | Derecho |
| jus-3 | Cöihcapxöt | Ley |
| jus-4 | Hapáctim | Verdad |
| acc-1 | Quih yaza | Cumplir |
| acc-2 | Quih islixp | Prometer |
| acc-3 | Cöihcaaitoj | Testigo |
| acc-4 | Cöihcaaitoj xaap iti ziix hapáctim | El testigo firma el documento |

## Fallback

Si no hay archivo MP3, la app usa síntesis de voz (TTS) del navegador leyendo el texto Seri. La pronunciación es aproximada; las grabaciones nativas son preferibles.
