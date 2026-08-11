// Cliente para el Workflow de Roboflow "walmart-gondola vwalmart-gondola-2-yolo11n-t1 Logic 2".
// Workspace: ndorfer-icb-cl · Workflow: walmart-gondola-vwalmart-gondola-2-yolo11n-t1-logic-2
//
// Requiere que config.js (ver config.example.js) defina window.ROBOFLOW_API_KEY
// antes de cargar este script. La key queda visible en el código fuente de la
// página a propósito (integración 100% client-side, sin backend) — ver README.

(function () {
  const ROBOFLOW_WORKFLOW_URL =
    "https://serverless.roboflow.com/ndorfer-icb-cl/workflows/walmart-gondola-vwalmart-gondola-2-yolo11n-t1-logic-2";
  const DEFAULT_TIMEOUT_MS = 20000;
  const DEFAULT_RETRIES = 2;

  class RoboflowWorkflowError extends Error {
    constructor(message, { cause, status } = {}) {
      super(message);
      this.name = "RoboflowWorkflowError";
      this.status = status;
      if (cause) this.cause = cause;
    }
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.onerror = () =>
        reject(new RoboflowWorkflowError("No se pudo leer la imagen para convertirla a base64"));
      reader.readAsDataURL(file);
    });
  }

  async function buildImageInput(imageInput) {
    if (typeof imageInput === "string") {
      if (!imageInput.startsWith("https://")) {
        throw new RoboflowWorkflowError(
          "Las URLs de imagen deben ser https:// (http:// es rechazado por Roboflow)"
        );
      }
      return { type: "url", value: imageInput };
    }
    if (imageInput instanceof Blob) {
      return { type: "base64", value: await fileToBase64(imageInput) };
    }
    throw new RoboflowWorkflowError("imageInput debe ser una URL https:// o un File/Blob");
  }

  // Se queda solo con los campos que usa la app; descarta detection_id/class_id/parent_id.
  function parseGondolaResult(body) {
    const outputs = Array.isArray(body) ? body : body?.outputs;
    if (!Array.isArray(outputs) || outputs.length === 0) {
      throw new RoboflowWorkflowError(
        'Respuesta del workflow sin "outputs" (¿cambió el contrato del workflow?)'
      );
    }

    const first = outputs[0];
    if (!first || typeof first !== "object" || !("predictions" in first)) {
      const keys = first ? Object.keys(first).join(", ") : "(vacío)";
      throw new RoboflowWorkflowError(
        `Falta la salida "predictions" en la respuesta. Claves recibidas: ${keys}`
      );
    }

    const predictions = first.predictions ?? {};
    const detections = Array.isArray(predictions.predictions)
      ? predictions.predictions.map((p) => ({
          class: p.class,
          confidence: p.confidence,
          x: p.x,
          y: p.y,
          width: p.width,
          height: p.height,
        }))
      : [];

    return {
      imageWidth: predictions.image?.width ?? null,
      imageHeight: predictions.image?.height ?? null,
      detections,
    };
  }

  function getApiKey() {
    const key = window.ROBOFLOW_API_KEY;
    if (!key) {
      throw new RoboflowWorkflowError(
        "window.ROBOFLOW_API_KEY no está definida. Copiá config.example.js a config.js y completá tu key."
      );
    }
    return key;
  }

  /**
   * Corre el Workflow de detección de góndola sobre una imagen.
   * @param {string | Blob} imageInput - URL https:// pública, o un File/Blob (foto local).
   * @param {{ timeoutMs?: number, retries?: number }} [options]
   * @returns {Promise<{ imageWidth: number|null, imageHeight: number|null, detections: Array<{class: string, confidence: number, x: number, y: number, width: number, height: number}> }>}
   */
  async function runGondolaWorkflow(imageInput, options = {}) {
    const { timeoutMs = DEFAULT_TIMEOUT_MS, retries = DEFAULT_RETRIES } = options;
    // window.ROBOFLOW_PROXY_URL: por defecto usa /api/infer (función
    // serverless de Vercel -- ver api/infer.js), que corre server-side y
    // evita el "Failed to fetch" del llamado directo desde el navegador; la
    // key nunca llega al cliente por ese camino. config.js puede pisar esto
    // con el proxy local (proxy_roboflow.py) para pruebas antes de pushear,
    // o con `null` explícito para forzar el llamado directo con api_key.
    const proxyUrl = window.ROBOFLOW_PROXY_URL !== undefined ? window.ROBOFLOW_PROXY_URL : "/api/infer";
    const targetUrl = proxyUrl || ROBOFLOW_WORKFLOW_URL;
    const image = await buildImageInput(imageInput);
    const requestBody = proxyUrl ? { inputs: { image } } : { api_key: getApiKey(), inputs: { image } };

    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(targetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          const retryable = res.status >= 500;
          const err = new RoboflowWorkflowError(
            `Roboflow respondió ${res.status}: ${text.slice(0, 300)}`,
            { status: res.status }
          );
          if (!retryable || attempt === retries) throw err;
          lastError = err;
          await sleep(500 * 2 ** attempt);
          continue;
        }

        const body = await res.json();
        return parseGondolaResult(body);
      } catch (err) {
        clearTimeout(timer);
        if (err instanceof RoboflowWorkflowError && err.status && err.status < 500) {
          throw err; // error del cliente (4xx) — no reintentar
        }

        const isAbort = err.name === "AbortError";
        const wrapped = isAbort
          ? new RoboflowWorkflowError("Tiempo de espera agotado llamando al workflow de Roboflow", {
              cause: err,
            })
          : err instanceof RoboflowWorkflowError
          ? err
          : new RoboflowWorkflowError(`Fallo de red llamando al workflow de Roboflow: ${err.message}`, {
              cause: err,
            });

        if (attempt === retries) throw wrapped;
        lastError = wrapped;
        await sleep(500 * 2 ** attempt);
      }
    }
    throw lastError;
  }

  window.RoboflowGondola = { runGondolaWorkflow, RoboflowWorkflowError };
})();
