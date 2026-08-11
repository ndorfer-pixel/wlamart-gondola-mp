# walmart_gondola_mp

Variante de [walmart-gondola](https://github.com/ndorfer-pixel/walmart-gondola)
que solo etiqueta y cuenta **Papas Amarillas Marco Polo** y **Rústicas Marco
Polo** (`mp_amarilla`, `mp_rustica`) — el resto de las clases que el modelo
detecta (Lays, `icb`, `no_clasificado`) se descartan antes de mostrarse o
guardarse. Mismo modelo de Roboflow, mismo backend de Supabase (bucket y
tabla `imagenes_gondola` compartidos con el proyecto original) — solo
cambia qué se etiqueta.

Para todo lo demás (arquitectura, flujo completo, por qué existe el proxy,
por qué se redimensiona la imagen, seguridad de la key, etc.) ver el
[README del proyecto original](https://github.com/ndorfer-pixel/walmart-gondola/blob/main/README.md) —
es exactamente el mismo código, con un filtro de clases aplicado en
`index.html` (`CLASES_PERMITIDAS`).

## Diferencias con el original

- `CLASES_PERMITIDAS = ['mp_amarilla', 'mp_rustica']` en `index.html` —
  `procesarDeteccion` filtra `resultado.detections` contra esta lista antes
  de guardarlas en el `item` (todo lo demás: dibujo, conteo, guardado en
  Supabase, usa ese resultado ya filtrado).
- `CLASES_COLUMNAS` (las columnas que se mandan a Supabase) también quedan
  reducidas a esas dos — las demás columnas de la tabla (`icb`,
  `lays_amarillas`, etc.) existen igual, pero esta app nunca las toca; quedan
  en 0 por el `DEFAULT` de la columna.
- Puertos locales distintos para poder correr los dos proyectos en paralelo
  sin que choquen: `8753` (archivos) / `8754` (proxy), en vez de `8743`/`8744`.
- Textos de la interfaz (título, header, info-strip) ajustados para
  mencionar solo Marco Polo.

## Setup local

1. Copiar `config.example.js` a `config.js` y completar
   `window.ROBOFLOW_API_KEY` con tu key privada de Roboflow.
2. Doble click en `iniciar_app.bat` (levanta los dos servidores locales y
   abre `index.html`), o a mano:
   ```powershell
   py -m http.server 8753
   py proxy_roboflow.py
   ```
3. Abrir `http://localhost:8753/index.html`.

## Deploy a producción

Todavía no está conectado a Vercel. Cuando se quiera deployar: crear un
proyecto de Vercel nuevo apuntando a este repo, y agregar `ROBOFLOW_API_KEY`
como variable de entorno (Settings → Environment Variables) — igual que se
hizo para el proyecto original.
