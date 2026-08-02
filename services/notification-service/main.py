import os
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="EcoMarket Notification Service", version="1.0.0")

# Secreto compartido para llamadas internas (payment-service → notification).
# Sin él configurado, el endpoint de envío queda deshabilitado (fail-safe).
INTERNAL_SECRET = os.getenv("INTERNAL_SERVICE_SECRET", "")


class NotificationRequest(BaseModel):
    user_id: str
    title: str
    body: str
    data: Optional[dict] = None


def _sanitize(value: str) -> str:
    """Evita inyección de logs eliminando saltos de línea del texto de usuario."""
    return str(value).replace("\r", " ").replace("\n", " ")[:500]


def require_internal(x_internal_secret: Optional[str] = Header(default=None)):
    if not INTERNAL_SECRET or x_internal_secret != INTERNAL_SECRET:
        raise HTTPException(status_code=401, detail="No autorizado")


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "notification-service"}


@app.post("/api/notifications/push")
async def send_push_notification(request: NotificationRequest, x_internal_secret: Optional[str] = Header(default=None)):
    """
    Envía una notificación push. Solo accesible por servicios internos que
    presenten el secreto compartido (evita el envío/abuso desde el exterior).
    """
    require_internal(x_internal_secret)

    color = "🟢" if "Exitoso" in request.title else "🔵"
    print(f"{color} [PUSH NOTIFICATION] To: {_sanitize(request.user_id)}")
    print(f"    Title: {_sanitize(request.title)}")
    print(f"    Body: {_sanitize(request.body)}")

    return {
        "status": "delivered",
        "message_id": f"msg_{os.urandom(4).hex()}",
        "user_id": request.user_id,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8086)
