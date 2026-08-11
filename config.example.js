// Copiar este archivo a config.js. Solo hace falta para PROBAR LOCAL antes
// de pushear -- en producción (Vercel) la key vive server-side como
// variable de entorno (ver api/infer.js) y este archivo ni siquiera existe
// (está en .gitignore).
//
// Apunta al proxy local (proxy_roboflow.py, puerto 8754) en vez de a
// /api/infer -- ese endpoint solo existe una vez deployado en Vercel.
window.ROBOFLOW_PROXY_URL = "http://localhost:8754/infer";

// Solo necesario si en algún momento querés probar el llamado DIRECTO (sin
// proxy) para depurar -- poné window.ROBOFLOW_PROXY_URL = null arriba para
// forzar ese camino. Esta es una API key PRIVADA de Roboflow (Settings >
// API Keys), no la "Publishable Key" (esa da 401 en este workflow).
window.ROBOFLOW_API_KEY = "TU_API_KEY_PRIVADA_AQUI";
