import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="EcoMarket Notification Service", version="1.0.0")

class NotificationRequest(BaseModel):
    user_id: str
    title: str
    body: str
    data: Optional[dict] = None

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "notification-service"}

@app.post("/api/notifications/push")
async def send_push_notification(request: NotificationRequest):
    """
    Sends a push notification.
    """
    color = "🟢" if "Exitoso" in request.title else "🔵"
    print(f"{color} [PUSH NOTIFICATION] To: {request.user_id}")
    print(f"    Title: {request.title}")
    print(f"    Body: {request.body}")
    
    return {
        "status": "delivered",
        "message_id": f"msg_{os.urandom(4).hex()}",
        "user_id": request.user_id
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8086)
