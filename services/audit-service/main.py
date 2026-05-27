from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
from typing import List, Optional
import hashlib
import time
import os
from motor.motor_asyncio import AsyncIOMotorClient
import httpx

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image as RLImage, HRFlowable
)
from reportlab.lib.units import inch, mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.graphics.shapes import Drawing, Rect, String, Circle
from reportlab.graphics import renderPDF
from io import BytesIO
import datetime
import os

MONGO_URI = os.getenv("MONGO_URI", "mongodb://admin:mongo_password@mongodb:27017")
client = AsyncIOMotorClient(MONGO_URI)
db = client.ecomarket_audit

app = FastAPI(title="EcoMarket Audit Service", description="AI-driven Eco-Score and audit ledger with MongoDB persistence")

CORS_ORIGINS = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,https://ecomarket.pe").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AI_ENGINE_HOST = os.getenv("AI_ENGINE_HOST", "ai-engine")
AI_ENGINE_PORT = os.getenv("AI_ENGINE_PORT", "8085")
AI_ENGINE_URL = f"http://{AI_ENGINE_HOST}:{AI_ENGINE_PORT}"

PRODUCT_SERVICE_HOST = os.getenv("PRODUCT_SERVICE_HOST", "product-service")
PRODUCT_SERVICE_PORT = os.getenv("PRODUCT_SERVICE_PORT", "8082")
PRODUCT_SERVICE_URL = f"http://{PRODUCT_SERVICE_HOST}:{PRODUCT_SERVICE_PORT}"


class AuditRequest(BaseModel):
    product_id: str
    ingredients: List[str]
    provider_id: str
    image_url: Optional[str] = "http://example.com/ingredients.jpg"


class AuditResult(BaseModel):
    product_id: str
    eco_score: int
    badges: List[str]
    audit_hash: str
    status: str
    details: dict


class ApproveRejectRequest(BaseModel):
    auditorId: str
    observaciones: Optional[str] = None


class ProducerAuditRequest(BaseModel):
    product_id: str
    product_name: str
    ingredients: List[str]
    category: str
    description: str
    provider_id: str


# ─── Base de Datos de Químicos Prohibidos / Restringidos ───
CHEMICAL_DB = {
    "sulfatos": {
        "aliases": ["sulfato", "sodium lauryl sulfate", "sls", "sodium laureth sulfate", "sles", "ammonium lauryl sulfate", "als"],
        "risk": "high",
        "reason": "Irritante cutáneo comprobado. Prohibido en cosmética ecológica certificada.",
        "regulation": "Reglamento CE 1223/2009 Anexo III"
    },
    "parabenos": {
        "aliases": ["parabeno", "methylparaben", "propylparaben", "butylparaben", "ethylparaben", "isobutylparaben"],
        "risk": "high",
        "reason": "Disruptor endocrino potencial. Prohibido en productos EcoMarket.",
        "regulation": "Reglamento CE 1223/2009 Anexo II"
    },
    "ftalatos": {
        "aliases": ["ftalato", "phthalate", "dbp", "dep", "bbp", "dehp", "dmp"],
        "risk": "high",
        "reason": "Tóxico reproductivo. Prohibido en cualquier producto de consumo ecológico.",
        "regulation": "REACH Anexo XVII"
    },
    "bpa": {
        "aliases": ["bisfenol a", "bisphenol a", "bpa-free"],
        "risk": "high",
        "reason": "Disruptor endocrino. Prohibido en envases alimentarios ecológicos.",
        "regulation": "Reglamento UE 2018/213"
    },
    "petrolatos": {
        "aliases": ["petrolato", "vaselina", "petroleum jelly", "mineral oil", "paraffinum liquidum", "petrolatum"],
        "risk": "high",
        "reason": "Derivado del petróleo sin biodegradabilidad. No permite certificación ecológica.",
        "regulation": "Estándar EcoMarket Art. 4.2"
    },
    "siliconas": {
        "aliases": ["silicona", "dimethicone", "cyclomethicone", "dimethiconol", "amodimethicone", "cyclohexasiloxane"],
        "risk": "medium",
        "reason": "No biodegradable. Acumulable en ecosistemas acuáticos.",
        "regulation": "Estándar EcoMarket Art. 4.3"
    },
    "triclosan": {
        "aliases": ["triclosán", "irgasan", "tcs"],
        "risk": "high",
        "reason": "Antimicrobiano sospechoso de resistencia bacteriana y toxicidad acuática.",
        "regulation": "FDA 2016 / Reglamento UE 2016/110"
    },
    "formaldehido": {
        "aliases": ["formaldehído", "formalin", "methylene glycol", "quaternium-15", "dmdm hydantoin", "diazolidinyl urea", "imidazolidinyl urea"],
        "risk": "high",
        "reason": "Carcinógeno humano conocido. Prohibido en cosmética natural.",
        "regulation": "Reglamento CE 1223/2009 Anexo II"
    },
    "microplasticos": {
        "aliases": ["microplástico", "polyethylene", "pe", "polypropylene", "pp", "nylon-12", "nylon-6", "acrylates copolymer"],
        "risk": "high",
        "reason": "Microplástico no biodegradable. Contaminante marino persistente.",
        "regulation": "ECHA 2019 / Restricción UE microplásticos"
    },
    "colorantes_azoicos": {
        "aliases": ["azo dye", "ci ", "fd&c", "pigment", "azoico", "tartrazine", "ci 19140"],
        "risk": "medium",
        "reason": "Potencial alergénico. Restringido en productos ecológicos.",
        "regulation": "Reglamento CE 1223/2009 Anexo IV"
    },
    "aluminio": {
        "aliases": ["aluminum", "aluminium", "potassium alum", "ammonium alum", "aluminum chlorohydrate"],
        "risk": "medium",
        "reason": "Neurotóxico potencial en altas concentraciones. Restringido.",
        "regulation": "Estándar EcoMarket Art. 5.1"
    },
}


def analyze_ingredients(ingredient_list: List[str]) -> dict:
    """Analiza una lista de ingredientes contra la base de datos química."""
    findings = []
    risk_levels = {"high": 0, "medium": 0, "low": 0}
    total_penalty = 0

    for ing in ingredient_list:
        ing_lower = ing.lower().strip()
        found = False
        for chem_name, chem_info in CHEMICAL_DB.items():
            for alias in chem_info["aliases"]:
                if alias in ing_lower or ing_lower in alias:
                    findings.append({
                        "ingredient": ing,
                        "matched_as": chem_name,
                        "risk": chem_info["risk"],
                        "reason": chem_info["reason"],
                        "regulation": chem_info["regulation"],
                    })
                    risk_levels[chem_info["risk"]] += 1
                    if chem_info["risk"] == "high":
                        total_penalty += 25
                    elif chem_info["risk"] == "medium":
                        total_penalty += 10
                    found = True
                    break
            if found:
                break
        if not found:
            risk_levels["low"] += 1

    return {
        "findings": findings,
        "risk_summary": risk_levels,
        "total_penalty": total_penalty,
    }


class AuditAnalyzeResponse(BaseModel):
    product_id: str
    eco_score: int
    badges: List[str]
    audit_hash: str
    status: str
    details: dict
    chemical_analysis: dict


@app.post("/api/audit/producer-analyze")
async def producer_audit_analyze(request: ProducerAuditRequest):
    """Valida ingredientes y genera auditoría automática para productores."""
    chem_result = analyze_ingredients(request.ingredients)

    base_score = 100
    penalty = chem_result["total_penalty"]

    issues = []
    for f in chem_result["findings"]:
        issues.append(f"{f['ingredient']}: {f['reason']}")

    eco_score = max(0, base_score - penalty)

    badges = []
    if eco_score >= 90:
        badges.append("Eco-Friendly")
        if chem_result["risk_summary"]["high"] == 0:
            badges.append("Tóxico-Free")
    if eco_score >= 80:
        badges.append("Vegan")
        badges.append("Cruelty Free")

    status = "APPROVED" if eco_score >= 70 else "REJECTED"

    timestamp = time.time()
    raw_data = f"{request.product_id}-{request.provider_id}-{eco_score}-{timestamp}"
    audit_hash = hashlib.sha256(raw_data.encode()).hexdigest()

    result_data = {
        "product_id": request.product_id,
        "eco_score": eco_score,
        "badges": badges,
        "audit_hash": audit_hash,
        "status": status,
        "details": {
            "ingredients": [
                {
                    "name": ing,
                    "safety": "green",
                    "desc": "Ingrediente sin alertas en base de datos química."
                }
                for ing in request.ingredients
                if not any(
                    alias in ing.lower()
                    for chem in CHEMICAL_DB.values()
                    for alias in chem["aliases"]
                )
            ],
            "issues": issues,
            "timestamp": timestamp,
            "auditor": "AI System 2.0 (EcoMarket Chemical DB)",
            "provider_id": request.provider_id,
            "chemical_analysis": chem_result,
        },
    }

    await db.audits.update_one(
        {"product_id": request.product_id},
        {"$set": result_data},
        upsert=True,
    )

    return {
        "eco_score": eco_score,
        "badges": badges,
        "status": status,
        "issues": issues,
        "chemical_analysis": chem_result,
        "audit_hash": audit_hash,
    }


@app.get("/api/audit/health")
async def health_check():
    try:
        await client.admin.command('ping')
        return {"status": "healthy", "service": "audit-service", "database": "connected"}
    except Exception as e:
        return {"status": "degraded", "service": "audit-service", "database": "disconnected", "error": str(e)}


@app.post("/api/audit/analyze", response_model=AuditResult)
async def analyze_product(request: AuditRequest):
    ai_analysis = {
        "product_name": "Unknown",
        "eco_score": 100,
        "ingredients": [],
        "status": "skipped"
    }

    async with httpx.AsyncClient() as client_http:
        try:
            ai_resp = await client_http.post(f"{AI_ENGINE_URL}/api/ai/analyze", json={"image_url": request.image_url})
            if ai_resp.status_code == 200:
                ai_analysis = ai_resp.json()
        except Exception as e:
            print(f"⚠️ AI Engine unavailable: {e}")

    score = ai_analysis["eco_score"]
    badges = [i["name"] for i in ai_analysis.get("ingredients", []) if i["risk_level"] == "low"][:3]
    issues = [i["description"] for i in ai_analysis.get("ingredients", []) if i["risk_level"] == "high"]

    bad_ingredients = ["sulfatos", "parabenos", "petrolato", "siliconas", "bpa"]
    for ing in request.ingredients:
        if any(bad in ing.lower() for bad in bad_ingredients):
            score -= 10
            issues.append(f"Regla local: {ing} detectado")

    if score >= 90:
        badges.extend(["Eco-Friendly", "Tóxico-Free"])
        if "plastico" not in [i.lower() for i in request.ingredients]:
            badges.append("Plastic Free")

    timestamp = time.time()
    raw_data = f"{request.product_id}-{request.provider_id}-{score}-{timestamp}"
    audit_hash = hashlib.sha256(raw_data.encode()).hexdigest()

    result_data = {
        "product_id": request.product_id,
        "eco_score": max(0, score),
        "badges": badges,
        "audit_hash": audit_hash,
        "status": "APPROVED" if score >= 70 else "REJECTED",
        "details": {
            "issues": issues,
            "timestamp": timestamp,
            "auditor": "AI System 1.0",
            "provider_id": request.provider_id
        }
    }

    await db.audits.update_one(
        {"product_id": request.product_id},
        {"$set": result_data},
        upsert=True
    )

    return result_data


@app.get("/api/audit/product/{product_id}")
async def get_product_audit(product_id: str):
    audit = await db.audits.find_one({"product_id": product_id})
    if not audit:
        return {
            "product_id": product_id,
            "eco_score": random.randint(85, 100),
            "badges": ["Vegan", "Plastic Free"],
            "audit_hash": "mock_hash",
            "status": "APPROVED",
            "details": {"info": "Mock data (Audit not found in DB)"}
        }

    audit.pop("_id", None)
    return audit


@app.get("/api/audit/pending")
async def get_pending_products():
    """Lista productos pendientes de revisión desde product-service."""
    async with httpx.AsyncClient() as client_http:
        try:
            response = await client_http.get(
                f"{PRODUCT_SERVICE_URL}/api/products",
                params={"status": "PENDING", "page": 0, "size": 50}
            )
            if response.status_code == 200:
                data = response.json()
                content = data.get("content", data) if isinstance(data, dict) else data
                return {"content": content}
        except Exception as e:
            print(f"⚠️ product-service unavailable: {e}")

    # Fallback demo
    return {
        "content": [
            {
                "id": "pending-001",
                "name": "Shampoo Sólido de Verbena",
                "description": "Fórmula 100% natural",
                "price": 14.5,
                "stock": 50,
                "category": "Cuidado Personal",
                "ecoScore": 98,
                "status": "PENDING",
                "origenRegion": "Cusco, Perú",
                "fechaProduccion": "2026-04-15",
                "fechaVencimiento": "2027-04-15",
                "providerName": "EcoShop",
                "providerRuc": "20123456789",
                "images": [],
                "certificacionPdfUrl": "#demo-cert.pdf",
            },
            {
                "id": "pending-002",
                "name": "Crema Facial Hidratante Aloe",
                "description": "Crema de aloe vera biológico",
                "price": 28.5,
                "stock": 75,
                "category": "Cuidado Personal",
                "ecoScore": 95,
                "status": "PENDING",
                "origenRegion": "Lima, Perú",
                "fechaProduccion": "2026-03-01",
                "fechaVencimiento": "2027-03-01",
                "providerName": "Selva Viva SAC",
                "providerRuc": "20564738291",
                "images": [],
                "certificacionPdfUrl": "#demo-cert2.pdf",
            },
        ]
    }


async def _update_product_status(product_id: str, status: str, motivo_rechazo: Optional[str] = None):
    payload = {"status": status}
    if motivo_rechazo:
        payload["motivoRechazo"] = motivo_rechazo

    async with httpx.AsyncClient() as client_http:
        try:
            await client_http.post(
                f"{PRODUCT_SERVICE_URL}/api/products/{product_id}/audit",
                json=payload,
            )
        except Exception as e:
            print(f"⚠️ Could not update product status: {e}")


@app.post("/api/audit/{product_id}/approve")
async def approve_product(product_id: str, body: ApproveRejectRequest):
    timestamp = time.time()
    audit_hash = hashlib.sha256(f"{product_id}-approve-{timestamp}".encode()).hexdigest()

    await db.audits.update_one(
        {"product_id": product_id},
        {"$set": {
            "product_id": product_id,
            "status": "APPROVED",
            "audit_hash": audit_hash,
            "eco_score": 95,
            "badges": ["Eco-Friendly"],
            "details": {
                "timestamp": timestamp,
                "auditor": body.auditorId,
                "observaciones": body.observaciones or "Aprobado por comité EcoMarket",
            },
        }},
        upsert=True,
    )

    await _update_product_status(product_id, "APPROVED")
    return {"success": True, "productId": product_id, "status": "APPROVED"}


@app.post("/api/audit/{product_id}/reject")
async def reject_product(product_id: str, body: ApproveRejectRequest):
    if not body.observaciones:
        raise HTTPException(status_code=400, detail="Las observaciones son obligatorias al rechazar.")

    timestamp = time.time()
    audit_hash = hashlib.sha256(f"{product_id}-reject-{timestamp}".encode()).hexdigest()

    await db.audits.update_one(
        {"product_id": product_id},
        {"$set": {
            "product_id": product_id,
            "status": "REJECTED",
            "audit_hash": audit_hash,
            "eco_score": 0,
            "badges": [],
            "details": {
                "timestamp": timestamp,
                "auditor": body.auditorId,
                "observaciones": body.observaciones,
                "issues": [body.observaciones],
            },
        }},
        upsert=True,
    )

    await _update_product_status(product_id, "REJECTED", body.observaciones)
    return {"success": True, "productId": product_id, "status": "REJECTED"}


async def get_product_details_from_service(product_id: str):
    async with httpx.AsyncClient() as client_http:
        try:
            response = await client_http.get(f"{PRODUCT_SERVICE_URL}/api/products/{product_id}")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Error fetching product: {e.response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Could not connect to product service: {e}")


def _build_eco_logo():
    d = Drawing(140, 40)
    d.add(Rect(0, 8, 140, 28, fillColor=colors.Color(0.1, 0.24, 0.20), strokeColor=None, rx=4, ry=4))
    d.add(Circle(22, 22, 8, fillColor=colors.Color(0.15, 0.6, 0.3), strokeColor=None))
    d.add(String(18, 16, "✦", fontName='Helvetica', fontSize=10, fillColor=colors.white))
    d.add(String(38, 14, "ECOMARKET", fontName='Helvetica-Bold', fontSize=11, fillColor=colors.white))
    d.add(String(38, 26, "AUDITORIA", fontName='Helvetica', fontSize=7, fillColor=colors.Color(0.6, 0.8, 0.7)))
    return d


def _build_improvements_table(issues: list, chemical_findings: list = None) -> Table:
    combined = list(issues)
    if chemical_findings:
        for f in chemical_findings:
            combined.append(f.get("reason", f.get("ingredient", "Incumplimiento químico")))

    data = [["#", "Área de Mejora", "Prioridad", "Estado", "Regulación"]]
    for i, issue in enumerate(combined, 1):
        prio = "CRÍTICA" if any(w in issue.lower() for w in ["prohibido", "no permitido", "vencido", "tóxico"]) else "ALTA" if any(w in issue.lower() for w in ["no cumple", "riesgo", "irritante", "disruptor"]) else "MEDIA"
        reg = ""
        if chemical_findings and i <= len(chemical_findings):
            reg = chemical_findings[i-1].get("regulation", "")
        data.append([str(i), issue, prio, "PENDIENTE", reg])

    table = Table(data, colWidths=[25, 210, 60, 60, 85])
    style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.Color(0.8, 0.2, 0.2)),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 7.5),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 7),
        ('TOPPADDING', (0, 0), (-1, 0), 7),
        ('LEFTPADDING', (1, 0), (1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.Color(0.8, 0.8, 0.8)),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.Color(1, 0.97, 0.95), colors.white]),
    ])

    for i in range(1, len(data)):
        prio = data[i][2]
        if prio == "CRÍTICA":
            style.add('TEXTCOLOR', (2, i), (2, i), colors.Color(0.8, 0.2, 0.2))
            style.add('BACKGROUND', (2, i), (2, i), colors.Color(1, 0.9, 0.9))
        elif prio == "ALTA":
            style.add('TEXTCOLOR', (2, i), (2, i), colors.Color(0.85, 0.5, 0.1))
            style.add('BACKGROUND', (2, i), (2, i), colors.Color(1, 0.95, 0.85))
    table.setStyle(style)
    return table


def _build_ingredient_table(ingredients: list) -> Table:
    data = [["Ingrediente", "Concentración", "Nivel de Riesgo", "Observación"]]
    for ing in ingredients:
        risk = ing.get("safety", ing.get("risk_level", "green"))
        risk_label = {"green": "BAJO", "yellow": "MEDIO", "red": "ALTO"}.get(risk, "BAJO")
        risk_color = {"green": colors.Color(0.2, 0.7, 0.3), "yellow": colors.Color(0.85, 0.65, 0.13), "red": colors.Color(0.8, 0.2, 0.2)}.get(risk, colors.green)
        data.append([
            ing.get("name", ing.get("description", "N/A")),
            ing.get("conc", ing.get("concentration", "N/A")),
            risk_label,
            ing.get("desc", ing.get("description", ""))
        ])

    table = Table(data, colWidths=[140, 70, 80, 150])
    style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.Color(0.1, 0.24, 0.20)),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (3, 0), (3, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.Color(0.8, 0.8, 0.8)),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.Color(0.97, 0.98, 0.95), colors.white]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ])
    for i in range(1, len(data)):
        r = data[i][2]
        if r == "ALTO":
            style.add('TEXTCOLOR', (2, i), (2, i), colors.Color(0.8, 0.2, 0.2))
            style.add('BACKGROUND', (2, i), (2, i), colors.Color(1, 0.9, 0.9))
        elif r == "MEDIO":
            style.add('TEXTCOLOR', (2, i), (2, i), colors.Color(0.85, 0.65, 0.13))
            style.add('BACKGROUND', (2, i), (2, i), colors.Color(1, 0.98, 0.9))
    table.setStyle(style)
    return table


@app.post("/api/audit/{product_id}/generate-certificate")
async def generate_certificate(product_id: str):
    audit_record = await db.audits.find_one({"product_id": product_id})
    if not audit_record:
        audit_record = {
            "audit_hash": hashlib.sha256(product_id.encode()).hexdigest()[:16],
            "status": "APPROVED",
            "details": {"timestamp": time.time(), "auditor": "EcoMarket Comité", "issues": []},
            "eco_score": 95,
            "badges": ["Eco-Friendly"],
        }

    try:
        product_details = await get_product_details_from_service(product_id)
    except HTTPException:
        product_details = {
            "name": "Producto EcoMarket",
            "description": "Certificación de demostración",
            "providerId": "N/A",
            "fechaProduccion": "N/A",
            "origenRegion": "Perú",
            "motivoRechazo": audit_record.get("details", {}).get("observaciones"),
        }

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
        leftMargin=50, rightMargin=50,
        topMargin=50, bottomMargin=50)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle('CustomTitle', parent=styles['h1'],
        fontSize=18, alignment=TA_CENTER, textColor=colors.Color(0.1, 0.24, 0.20),
        spaceAfter=6, fontName='Helvetica-Bold')
    subtitle_style = ParagraphStyle('CustomSub', parent=styles['Normal'],
        fontSize=9, alignment=TA_CENTER, textColor=colors.Color(0.4, 0.4, 0.4),
        spaceAfter=20)
    h2_style = ParagraphStyle('SectionTitle', parent=styles['h2'],
        fontSize=12, textColor=colors.Color(0.1, 0.24, 0.20),
        spaceBefore=12, spaceAfter=6, fontName='Helvetica-Bold',
        borderPadding=(0, 0, 4, 0))
    normal_style = ParagraphStyle('CustomNormal', parent=styles['Normal'],
        fontSize=9, leading=13, spaceAfter=3)
    label_style = ParagraphStyle('Label', parent=normal_style,
        fontSize=8, textColor=colors.Color(0.5, 0.5, 0.5),
        fontName='Helvetica-Bold')
    mejora_header = ParagraphStyle('MejoraHeader', parent=styles['h2'],
        fontSize=13, textColor=colors.Color(0.8, 0.2, 0.2),
        spaceBefore=16, spaceAfter=8, fontName='Helvetica-Bold')
    ok_style = ParagraphStyle('OKText', parent=normal_style,
        fontSize=10, textColor=colors.Color(0.15, 0.6, 0.3),
        fontName='Helvetica-Bold')

    story = []

    # --- HEADER with Logo ---
    logo_drawing = _build_eco_logo()
    renderPDF.draw(logo_drawing, 50, 740, story)

    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.Color(0.1, 0.24, 0.20)))
    story.append(Spacer(1, 6))

    story.append(Paragraph("CERTIFICADO DE AUDITORÍA DE PRODUCTO", title_style))
    story.append(Paragraph("Reporte Técnico de Validación Ecológica · Trazabilidad Inmutable", subtitle_style))
    story.append(Spacer(1, 6))

    status = audit_record.get('status', 'APPROVED')
    eco_score = audit_record.get('eco_score', 95)
    badges = audit_record.get('badges', [])

    # --- STATUS BADGE ---
    status_color = colors.Color(0.15, 0.6, 0.3) if status == 'APPROVED' else colors.Color(0.8, 0.2, 0.2)
    status_bg = colors.Color(0.9, 0.97, 0.9) if status == 'APPROVED' else colors.Color(1, 0.9, 0.9)
    status_label = "APROBADO" if status == 'APPROVED' else "RECHAZADO"

    status_data = [[
        Paragraph(f"Estado: <font color='{'green' if status == 'APPROVED' else 'red'}'><b>{status_label}</b></font>", normal_style),
        Paragraph(f"Eco-Score: <b>{eco_score}/100</b>", normal_style),
        Paragraph(f"Badges: {', '.join(badges) if badges else 'N/A'}", normal_style),
    ]]
    status_table = Table(status_data, colWidths=[180, 120, 140])
    status_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), status_bg),
        ('BOX', (0, 0), (-1, 0), 1, status_color),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('LEFTPADDING', (0, 0), (-1, 0), 12),
    ]))
    story.append(status_table)
    story.append(Spacer(1, 12))

    # --- SECTION 1: Datos de Auditoría ---
    story.append(Paragraph("1. DATOS DE AUDITORÍA", h2_style))
    ts = audit_record.get('details', {}).get('timestamp', time.time())
    audit_data = [
        [Paragraph(f"<b>ID de Auditoría:</b> {audit_record.get('audit_hash', 'N/A')}", normal_style),
         Paragraph(f"<b>Fecha:</b> {datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')}", normal_style)],
        [Paragraph(f"<b>Auditor:</b> {audit_record.get('details', {}).get('auditor', 'Sistema EcoMarket')}", normal_style),
         Paragraph(f"<b>Método:</b> IA + Revisión Manual", normal_style)],
    ]
    audit_table = Table(audit_data, colWidths=[220, 220])
    audit_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.5, colors.Color(0.8, 0.8, 0.8)),
        ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.Color(0.9, 0.9, 0.9)),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (0, 0), (-1, -1), colors.Color(0.97, 0.98, 0.95)),
    ]))
    story.append(audit_table)
    story.append(Spacer(1, 10))

    # --- SECTION 2: Datos del Producto ---
    story.append(Paragraph("2. DATOS DEL PRODUCTO", h2_style))
    prod_data = [
        [Paragraph(f"<b>Nombre:</b> {product_details.get('name', 'N/A')}", normal_style),
         Paragraph(f"<b>Categoría:</b> {product_details.get('category', 'N/A')}", normal_style)],
        [Paragraph(f"<b>Proveedor ID:</b> {product_details.get('providerId', 'N/A')}", normal_style),
         Paragraph(f"<b>Origen:</b> {product_details.get('origenRegion', 'N/A')}", normal_style)],
        [Paragraph(f"<b>Descripción:</b> {product_details.get('description', 'N/A')[:80]}", normal_style), Paragraph("", normal_style)],
    ]
    prod_table = Table(prod_data, colWidths=[220, 220])
    prod_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.5, colors.Color(0.8, 0.8, 0.8)),
        ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.Color(0.9, 0.9, 0.9)),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (0, 0), (-1, -1), colors.white),
    ]))
    story.append(prod_table)
    story.append(Spacer(1, 10))

    # --- SECTION 3: Análisis de Ingredientes ---
    story.append(Paragraph("3. ANÁLISIS DE INGREDIENTES Y SEGURIDAD", h2_style))
    ingredients = audit_record.get("details", {}).get("ingredients", [])
    if not ingredients:
        ingredients = product_details.get("ingredients", [])
    if ingredients:
        story.append(_build_ingredient_table(ingredients))
    else:
        story.append(Paragraph("No se registraron ingredientes específicos en esta auditoría.", normal_style))
    story.append(Spacer(1, 10))

    # --- SECTION 4: Mejoras Requeridas (for rejected or improvement-needed) ---
    issues = audit_record.get("details", {}).get("issues", [])
    if product_details.get("motivoRechazo"):
        issues.append(product_details["motivoRechazo"])

    if status == 'REJECTED' or issues:
        story.append(Paragraph("4. MEJORAS REQUERIDAS", mejora_header))
        story.append(Paragraph(
            "El producto no cumple con los estándares ecológicos de EcoMarket. "
            "Se requieren las siguientes correcciones antes de una nueva reevaluación:",
            normal_style))
        story.append(Spacer(1, 6))

        chemical_findings = audit_record.get("details", {}).get("chemical_analysis", {}).get("findings", [])
        if issues:
            story.append(_build_improvements_table(issues, chemical_findings))
        elif product_details.get("motivoRechazo"):
            story.append(_build_improvements_table([product_details["motivoRechazo"]], chemical_findings))

        story.append(Spacer(1, 10))

        severity = sum(1 for i in issues if any(w in i.lower() for w in ["prohibido", "tóxico", "no permitido"])) if issues else 0
        if severity > 2:
            story.append(Paragraph(
                "<b>⚠️ Alerta Crítica:</b> Se detectaron múltiples incumplimientos regulatorios graves. "
                "Se recomienda una revisión completa de la formulación del producto antes de re-auditar.",
                ParagraphStyle('CriticalNote', parent=normal_style, fontSize=8, textColor=colors.Color(0.8, 0.2, 0.2),
                               backColor=colors.Color(1, 0.95, 0.95), borderPadding=6)))

        story.append(Spacer(1, 6))
        story.append(Paragraph(
            "<b>Nota:</b> Una vez realizadas las correcciones, el productor puede solicitar una "
            "nueva auditoría a través del panel de productor en EcoMarket.",
            ParagraphStyle('Note', parent=normal_style, fontSize=8, textColor=colors.Color(0.5, 0.5, 0.5))))
    else:
        story.append(Paragraph("4. CONCLUSIONES", h2_style))
        story.append(Paragraph(
            "El producto cumple satisfactoriamente con todos los estándares de calidad, "
            "pureza y sostenibilidad exigidos por EcoMarket. Se certifica su comercialización "
            "en la plataforma.",
            ok_style))

    # --- FOOTER ---
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.Color(0.7, 0.7, 0.7)))
    story.append(Spacer(1, 6))

    footer_data = [
        [Paragraph(f"<b>EcoMarket Perú S.A.C.</b>", normal_style),
         Paragraph(f"<i>Generado el: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</i>",
                   ParagraphStyle('Footer', parent=normal_style, alignment=TA_RIGHT, fontSize=8))],
        [Paragraph("Certificación Inmutable · Trazabilidad QLDB · Comercio Justo",
                   ParagraphStyle('Footer2', parent=normal_style, fontSize=7, textColor=colors.Color(0.5, 0.5, 0.5))),
         Paragraph("Firma Digital: ---", ParagraphStyle('Footer3', parent=normal_style, alignment=TA_RIGHT, fontSize=8))],
    ]
    footer_table = Table(footer_data, colWidths=[220, 220])
    footer_table.setStyle(TableStyle([
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(footer_table)

    doc.build(story)
    buffer.seek(0)

    filename = f"ecomarket_audit_{product_id[:8]}_{status.lower()}_{datetime.datetime.now().strftime('%Y%m%d')}.pdf"
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
