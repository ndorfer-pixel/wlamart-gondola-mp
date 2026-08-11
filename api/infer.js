// Proxy serverless (Vercel) para el Workflow de Roboflow (walmart-gondola).
//
// Existe porque llamar al workflow directo con fetch() desde un navegador
// real falla con "Failed to fetch" de forma reproducible (probado en
// Chrome, Edge, Incognito, wifi corporativo y datos móviles), mientras que
// el mismo request desde un servidor (esta función, o el proxy local
// proxy_roboflow.py) funciona siempre. Reportado a Roboflow.
//
// Requiere la variable de entorno ROBOFLOW_API_KEY configurada en Vercel
// (Project Settings > Environment Variables) -- la key nunca llega al
// navegador con este esquema.

const ROBOFLOW_WORKFLOW_URL =
  "https://serverless.roboflow.com/ndorfer-icb-cl/workflows/walmart-gondola-vwalmart-gondola-2-yolo11n-t1-logic-2";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ROBOFLOW_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "ROBOFLOW_API_KEY no está configurada en Vercel" });
    return;
  }

  let payload;
  try {
    payload = { ...req.body, api_key: apiKey };
  } catch (err) {
    res.status(400).json({ error: "Body inválido" });
    return;
  }

  try {
    const roboflowRes = await fetch(ROBOFLOW_WORKFLOW_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await roboflowRes.text();
    res.status(roboflowRes.status).setHeader("Content-Type", "application/json").send(text);
  } catch (err) {
    res.status(502).json({ error: `No se pudo contactar a Roboflow: ${err.message}` });
  }
};
