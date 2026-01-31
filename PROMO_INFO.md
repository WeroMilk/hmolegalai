# Promoción: Primeros 10 Clientes

## ¿Qué hace?

Los **primeros 10 usuarios** que se registren reciben **5 documentos gratis** cada uno.

- No necesitan código: se aplica automáticamente al registrarse
- Ven un banner verde: «¡Eres uno de los primeros 10! Tienes X documentos gratis»
- El botón cambia a «Generar con documento gratis» mientras tengan créditos
- Funciona para descarga ($59) y guardado en cuenta ($99): cada uso consume 1 documento gratis

## Configuración

Requiere **Firebase Admin** y **Firestore** configurados. Las colecciones se crean automáticamente:

- `promo_allocations`: por usuario (`userId`), con `freeDocsRemaining` y `createdAt`
- `promo_state`: documento `count` con el total de usuarios que ya tienen promo

## Cómo funciona

1. El usuario se registra (email o Google)
2. En su primera visita a un documento, se llama a `/api/promo-check`
3. Si hay menos de 10 usuarios con promo, se le asigna 5 documentos gratis
4. Cada vez que genera un documento con el botón «Generar con documento gratis», se llama a `/api/promo-use` y se descuenta 1
