# walmart_gondola_mp

Versión simplificada: **solo captura y sube fotos de góndola a Supabase — no
corre ningún modelo de detección.** (Antes esta app etiquetaba Marco Polo
Amarilla/Rústica vía Roboflow; se sacó esa parte para volver a un flujo más
simple y liviano.)

Mismo backend que [walmart-gondola](https://github.com/ndorfer-pixel/walmart-gondola):
mismo bucket de Storage y misma tabla `imagenes_gondola` en Supabase. Las
columnas de conteo por producto (`mp_amarilla`, `mp_rustica`, etc.) existen
en la tabla pero esta app no las llena — quedan en 0 por el `DEFAULT` de la
columna.

## Qué hace

1. Elegís la sala (buscador con autocompletado).
2. Sacás fotos con la cámara (dentro de la página, con guía de encuadre) o
   las elegís de la galería.
3. Tocás "⬆️ Subir imágenes" — se suben a Supabase Storage y se registra la
   fila (sala, url, nombre de archivo) en `imagenes_gondola`. Nada se
   etiqueta ni se procesa con IA.

## Cámara: guía de encuadre + continuidad para góndolas largas

"📷 Tomar foto" abre la cámara dentro de la página (`getUserMedia`) con un
recuadro guía en la proporción real de la góndola (120cm ancho × 175cm alto).

Para góndolas de varios metros (una sola foto no alcanza), hay una ayuda de
**continuidad entre tramos** -- **no une ni hace stitching de las fotos**,
cada una se guarda por separado:

- Después de sacar una foto, la cámara se queda abierta y muestra un
  **borde difuminado** de esa misma foto pegado al costado del encuadre.
- Ese borde es el tramo de la góndola que ya quedó fotografiado -- alineás
  el celular para que el siguiente tramo empiece justo donde terminó el
  anterior, y sacás la próxima foto ya calzada.
- Botón **➡/⬅** para elegir la dirección en la que se recorre la góndola
  (de qué lado se muestra el borde de referencia).
- Botón **🔄 Nueva serie** para sacarte de encima el borde de referencia
  cuando vas a fotografiar una góndola distinta o no relacionada.

## Archivos

| Archivo | Qué hace |
|---|---|
| `index.html` | Toda la app: sala, cámara con guía + continuidad, subida a Supabase. |
| `iniciar_app.bat` | Doble click para levantar el servidor local y abrir la app. |

## Setup local

No requiere API keys ni configuración -- es HTML/JS plano sin dependencias.

1. Doble click en `iniciar_app.bat` (levanta el servidor y abre
   `index.html`), o a mano:
   ```powershell
   py -m http.server 8753
   ```
2. Abrir `http://localhost:8753/index.html`.

## Deploy

Conectado a Vercel (`wlamart-gondola-mp`), deploy automático en cada push a
`main` -- sin variables de entorno necesarias (ya no depende de Roboflow).
Si tenías `ROBOFLOW_API_KEY` configurada ahí de antes, se puede borrar sin
problema (Vercel → proyecto → Settings → Environment Variables).
