import os
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import time

app = FastAPI(title="EcoMarket AI Engine", version="1.0.0")

class AnalysisRequest(BaseModel):
    image_url: str

class Ingredient(BaseModel):
    name: str
    risk_level: str  # low, medium, high
    description: str

class AnalysisResponse(BaseModel):
    product_name: str
    eco_score: int
    ingredients: List[Ingredient]
    status: str

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "ai-engine"}

@app.post("/api/ai/analyze", response_model=AnalysisResponse)
async def analyze_ingredients(request: AnalysisRequest):
    """
    Simulates AI analysis of product ingredients.
    """
    print(f"🤖 AI Engine: Analyzing image {request.image_url}")
    
    # Simulate processing time
    time.sleep(1.2)
    
    # Pseudo-random but deterministic based on image_url length
    is_eco = len(request.image_url) % 2 == 0
    
    if is_eco:
        return {
            "product_name": "Organic Eco-Snack",
            "eco_score": 92,
            "ingredients": [
                {"name": "Organic Oats", "risk_level": "low", "description": "100% sustainable"},
                {"name": "Honey", "risk_level": "low", "description": "Local source"}
            ],
            "status": "completed"
        }
    else:
        return {
            "product_name": "Standard Snack",
            "eco_score": 45,
            "ingredients": [
                {"name": "Palm Oil", "risk_level": "high", "description": "Deforestation risk"},
                {"name": "Artificial Red 40", "risk_level": "medium", "description": "Synthetic dye"}
            ],
            "status": "completed"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8085)
