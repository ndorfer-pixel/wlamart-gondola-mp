"""Proxy local para el Workflow de Roboflow (walmart-gondola-mp).

Uso: py proxy_roboflow.py
Requiere ROBOFLOW_API_KEY en el entorno. Escucha en http://localhost:8754/infer.
Puerto distinto al del proyecto walmart_gondola original (8744) para poder
correr los dos en paralelo sin que choquen.

Existe porque llamar al workflow directo desde fetch() de un navegador real
falla con "Failed to fetch" de forma reproducible (probado en Chrome, Edge,
Incognito, wifi corporativo y datos móviles) mientras que el mismo request
desde un script (PowerShell, este proxy) funciona siempre. Reportado a
Roboflow via meta_feedback_send. Este proxy corre como script, no como
navegador, así que no le pega ese bloqueo -- y de paso la API key nunca
llega al navegador.
"""

import json
import os
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROBOFLOW_WORKFLOW_URL = (
    "https://serverless.roboflow.com/ndorfer-icb-cl/workflows/"
    "walmart-gondola-vwalmart-gondola-2-yolo11n-t1-logic-2"
)
PORT = 8754


def get_api_key():
    key = os.environ.get("ROBOFLOW_API_KEY")
    if not key:
        raise RuntimeError("ROBOFLOW_API_KEY no esta definida en el entorno")
    return key


class ProxyHandler(BaseHTTPRequestHandler):
    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors_headers()
        self.end_headers()

    def do_POST(self):
        if self.path != "/infer":
            self.send_response(404)
            self._cors_headers()
            self.end_headers()
            return

        length = int(self.headers.get("Content-Length", 0))
        raw_body = self.rfile.read(length)

        try:
            payload = json.loads(raw_body or b"{}")
        except json.JSONDecodeError:
            self._respond(400, {"error": "JSON invalido"})
            return

        try:
            payload["api_key"] = get_api_key()
        except RuntimeError as err:
            self._respond(500, {"error": str(err)})
            return

        req = urllib.request.Request(
            ROBOFLOW_WORKFLOW_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                self._respond_raw(resp.status, resp.read())
        except urllib.error.HTTPError as err:
            self._respond_raw(err.code, err.read())
        except urllib.error.URLError as err:
            self._respond(502, {"error": f"No se pudo contactar a Roboflow: {err}"})

    def _respond(self, status, obj):
        self._respond_raw(status, json.dumps(obj).encode("utf-8"))

    def _respond_raw(self, status, body_bytes):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self._cors_headers()
        self.end_headers()
        self.wfile.write(body_bytes)

    def log_message(self, format, *args):  # noqa: A002 - firma fija de BaseHTTPRequestHandler
        print(f"[proxy] {self.address_string()} - {format % args}")


if __name__ == "__main__":
    server = ThreadingHTTPServer(("localhost", PORT), ProxyHandler)
    print(f"Proxy de Roboflow escuchando en http://localhost:{PORT}/infer")
    print("Requiere ROBOFLOW_API_KEY en el entorno. Ctrl+C para detener.")
    server.serve_forever()
