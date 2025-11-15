# main.py — Banco Agrario (FastAPI + PostgreSQL en Railway)
from datetime import date, datetime, timedelta
from typing import List, Optional, Dict, Tuple
import os
import zoneinfo
from datetime import date

from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import (
    Boolean, create_engine, Column, Integer, BigInteger, String, Date, DateTime, Numeric,
    ForeignKey, CheckConstraint, func, text
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, Session
import openpyxl
import io
import traceback

# ---------------- Config ----------------
TZ = zoneinfo.ZoneInfo("America/Bogota")
DATABASE_URL = "postgresql://postgres:lLPdWtiLGkpEyzQxZcCWclVfZfZKyTjX@shortline.proxy.rlwy.net:28607/railway"
PORT=8000
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL no está definida.")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
Base = declarative_base()

# ----------------- Database Dependency -----------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ----------- Utilidades de semanas/labels -----------
MESES_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
            "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

def to_date(v) -> date:
    """Convierte v en date de forma robusta (acepta date, datetime, 'YYYY-MM-DD')."""
    if isinstance(v, date) and not isinstance(v, datetime):
        return v
    if isinstance(v, datetime):
        return v.date()
    if isinstance(v, str):
        s = v.strip()
        try:
            return datetime.fromisoformat(s).date()
        except Exception:
            return datetime.fromisoformat(s[:10]).date()
    raise ValueError(f"No puedo convertir a date: {type(v)} {v!r}")

def monday_of(d: date) -> date:
    return d - timedelta(days=d.weekday())

def month_label(d: date) -> str:
    return f"{MESES_ES[d.month-1]}_{d.year%100:02d}"

def week_index_in_month(week_monday: date) -> int:
    first_of_month = week_monday.replace(day=1)
    first_mon = monday_of(first_of_month)
    return ((week_monday - first_mon).days // 7) + 1

def label_excel(week_monday: date) -> str:
    """Devuelve un string con el formato 'Mes_Año:Sem X'."""
    ml = month_label(week_monday)
    wl = f"Sem {week_index_in_month(week_monday)}"
    return f"{ml}:{wl}"

def build_window(start_any, weeks: int):
    """Devuelve (lista_de_lunes, labels_excel) a partir de start_any (str|date)."""
    try:
        start_d = to_date(start_any)
        start_monday = monday_of(start_d)
        
        # Generar las semanas correctamente
        wms = []
        labels = []
        
        for i in range(int(weeks)):
            week_monday = start_monday + timedelta(days=7 * i)
            wms.append(week_monday)
            labels.append(label_excel(week_monday))
        
        print(f"🔍 build_window: {len(wms)} semanas desde {start_monday}")
        return wms, labels
    except Exception as e:
        print(f"❌ Error en build_window: {e}")
        return [], []

def daterange_mondays(start: date, end: date) -> List[date]:
    """Genera una lista de lunes entre start y end (inclusive)."""
    if start > end:
        return []
    
    current = monday_of(start)
    mondays = []
    
    while current <= end:
        mondays.append(current)
        current += timedelta(days=7)
    
    return mondays

# ----------------- Modelos SQLAlchemy -----------------
class Resource(Base):
    __tablename__ = "resources"
    id = Column(BigInteger, primary_key=True)
    name = Column(String(120), unique=True, nullable=False)
    unit = Column(String(120))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(TZ), nullable=False)

class Project(Base):
    __tablename__ = "projects"
    id = Column(BigInteger, primary_key=True)
    name = Column(String(200), nullable=False)
    classification = Column(String(20), nullable=False)
    phase = Column(String(20), nullable=False)
    complexity = Column(String(10), nullable=False)
    has_resource = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(TZ), nullable=False)

class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(BigInteger, primary_key=True)
    project_id = Column(BigInteger, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    resource_id = Column(BigInteger, ForeignKey("resources.id", ondelete="CASCADE"), nullable=False)
    start_week_monday = Column(Date, nullable=False)
    end_week_monday = Column(Date, nullable=False)
    subprocess = Column(String(120), nullable=False)
    can_ordinal = Column(Integer, nullable=False, default=1)
    classification = Column(String(20), nullable=False)
    complexity = Column(String(10), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(TZ), nullable=False)

    project = relationship("Project")
    resource = relationship("Resource")
    weeks = relationship("AssignmentWeek", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint('end_week_monday >= start_week_monday', name='chk_week_range'),
    )

class AssignmentWeek(Base):
    __tablename__ = "assignment_weeks"
    id = Column(BigInteger, primary_key=True)
    assignment_id = Column(BigInteger, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False)
    week_monday = Column(Date, nullable=False)
    week_friday = Column(Date, nullable=False)
    month_label = Column(String(40), nullable=False)
    week_label = Column(String(20), nullable=False)
    speculative_pct = Column(Numeric(5,2), nullable=False)
    subprocess = Column(String(120), nullable=False)
    can_ordinal = Column(Integer, nullable=False)
    project_id = Column(BigInteger, nullable=False)
    resource_id = Column(BigInteger, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(TZ), nullable=False)

# ----------------- Schemas Pydantic -----------------
class ResourceIn(BaseModel):
    name: str
    unit: Optional[str] = None

class ResourceOut(BaseModel):
    id: int
    name: str
    unit: Optional[str]
    class Config: 
        from_attributes = True

class ProjectIn(BaseModel):
    name: str
    classification: str
    phase: str
    complexity: str
    has_resource: bool = True

class ProjectOut(BaseModel):
    id: int
    name: str
    classification: str
    phase: str
    complexity: str
    has_resource: bool
    class Config: 
        from_attributes = True

class AssignmentIn(BaseModel):
    project_id: int
    resource_id: int
    start_week_monday: date
    end_week_monday: date
    subprocess: str
    can_ordinal: int
    percentage: Optional[float] = None  # Nuevo campo para porcentaje

class AssignmentOut(BaseModel):
    id: int
    project_id: int
    resource_id: int
    start_week_monday: date
    end_week_monday: date
    subprocess: str
    can_ordinal: int
    classification: str
    complexity: str
    class Config: 
        from_attributes = True

class WeekOut(BaseModel):
    id: int
    week_monday: date
    week_friday: date
    month_label: str
    week_label: str
    speculative_pct: float
    subprocess: str
    can_ordinal: int
    project_id: int
    resource_id: int
    class Config: 
        from_attributes = True

# ----------------- App & CORS -----------------
app = FastAPI(title="Banco Agrario Backend (Railway/PostgreSQL)", version="0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

@app.options("/api/{rest_of_path:path}")
async def preflight_handler(request: Request, rest_of_path: str):
    return JSONResponse(status_code=200, content={})
@app.get("/")
def root():
    return {"ok": True, "msg": "Backend Banco Agrario conectado a PostgreSQL (Railway)."}

# ----------------- Helpers negocio -----------------
def check_capacity_or_fail(s, resource_id: int, week_mondays: List[date], pct: float):
    """Suma % por recurso/semana; si excede 100, devuelve 409 con detalle."""
    over = []
    for wm in week_mondays:
        total = s.query(func.coalesce(func.sum(AssignmentWeek.speculative_pct), 0.0))\
                 .filter(AssignmentWeek.resource_id == resource_id,
                         AssignmentWeek.week_monday == wm)\
                 .scalar()
        if float(total) + pct > 100.0 + 1e-6:
            ml, wl = label_excel(wm)
            over.append({"week_monday": str(wm), "label": f"{ml}:{wl}",
                         "current": float(total), "new": pct})
    if over:
        raise HTTPException(
            status_code=409,
            detail={
                "message": "El recurso no cuenta con disponibilidad en las siguientes semanas.",
                "weeks": over
            }
        )

def create_tables():
    try:
        print("Creando tablas en la base de datos...")
        Base.metadata.create_all(bind=engine)
        print("✅ Tablas creadas exitosamente")
    except Exception as e:
        print(f"❌ Error creando tablas: {e}")

create_tables()

# ----------------- Endpoints -----------------
@app.get("/api/debug/tables")
def debug_tables():
    with SessionLocal() as s:
        tables = s.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)).fetchall()
        return {"tables": [table[0] for table in tables]}

# Resources
@app.get("/api/resources", response_model=List[ResourceOut])
def list_resources():
    with SessionLocal() as s:
        return s.query(Resource).order_by(Resource.name).all()

@app.post("/api/resources", response_model=ResourceOut)
def create_resource(payload: ResourceIn):
    with SessionLocal() as s:
        r = Resource(name=payload.name.strip(), unit=(payload.unit or None))
        s.add(r)
        try:
            s.commit()
        except Exception as e:
            s.rollback()
            raise HTTPException(400, f"No se pudo crear el recurso: {e}")
        s.refresh(r)
        return r

# Projects
@app.get("/api/projects", response_model=List[ProjectOut])
def list_projects():
    with SessionLocal() as s:
        return s.query(Project).order_by(Project.name).all()

@app.post("/api/projects", response_model=ProjectOut)
def create_project(payload: ProjectIn):
    # Validaciones básicas sin PCT_MATRIX
    valid_classifications = ["Proyecto", "Anteproyecto", "Estrategia", "Admon"]
    valid_complexities = ["Alta", "Media", "Baja"]
    
    if payload.classification not in valid_classifications:
        raise HTTPException(400, f"Clasificación inválida. Debe ser una de: {valid_classifications}")
    
    if payload.complexity not in valid_complexities:
        raise HTTPException(400, f"Complejidad inválida. Debe ser una de: {valid_complexities}")
    
    with SessionLocal() as s:
        p = Project(
            name=payload.name.strip(),
            classification=payload.classification,
            phase=payload.phase,
            complexity=payload.complexity,
            has_resource=payload.has_resource
        )
        s.add(p)
        s.commit()
        s.refresh(p)
        return p

# Assignments
@app.post("/api/assignments", response_model=AssignmentOut)
def create_assignment(payload: AssignmentIn):
    if payload.end_week_monday < payload.start_week_monday:
        raise HTTPException(400, "La semana fin no puede ser anterior a la semana inicio.")
    
    if payload.start_week_monday.weekday() != 0 or payload.end_week_monday.weekday() != 0:
        raise HTTPException(400, "Las fechas deben corresponder a lunes.")

    with SessionLocal() as s:
        proj = s.get(Project, payload.project_id)
        res = s.get(Resource, payload.resource_id)
        if not proj or not res:
            raise HTTPException(404, "Proyecto o Recurso no encontrado.")

        weeks = daterange_mondays(payload.start_week_monday, payload.end_week_monday)
        
        # USAR percentage SI SE PROVEE, SINO 10% POR DEFECTO
        if payload.percentage is not None:
            pct = payload.percentage
        else:
            pct = 10.0  # Porcentaje por defecto

        check_capacity_or_fail(s, res.id, weeks, pct)

        asg = Assignment(
            project_id=proj.id,
            resource_id=res.id,
            start_week_monday=payload.start_week_monday,
            end_week_monday=payload.end_week_monday,
            subprocess=payload.subprocess,
            can_ordinal=payload.can_ordinal,
            classification=proj.classification,
            complexity=proj.complexity
        )
        s.add(asg)
        s.flush()

        for wm in weeks:
            wf = wm + timedelta(days=4)
            full_label = label_excel(wm)
            if ":" in full_label:
                ml, wl = full_label.split(":", 1)
            else:
                ml, wl = full_label, f"Sem {week_index_in_month(wm)}"
            
            s.add(AssignmentWeek(
                assignment_id=asg.id,
                week_monday=wm,
                week_friday=wf,
                month_label=ml,
                week_label=wl,
                speculative_pct=pct,
                subprocess=payload.subprocess,
                can_ordinal=payload.can_ordinal,
                project_id=proj.id,
                resource_id=res.id
            ))
        
        s.commit()
        s.refresh(asg)
        return asg

@app.get("/api/assignments/{assignment_id}/weeks", response_model=List[WeekOut])
def get_assignment_weeks(assignment_id: int):
    with SessionLocal() as s:
        return s.query(AssignmentWeek)\
                .filter(AssignmentWeek.assignment_id == assignment_id)\
                .order_by(AssignmentWeek.week_monday).all()

# Summaries
@app.get("/api/projects/summary")
def projects_summary():
    with SessionLocal() as s:
        rows = s.execute(
            text("""
                SELECT p.id, p.name,
                       COUNT(DISTINCT aw.resource_id) AS n_personas,
                       MIN(aw.week_monday) AS fecha_inicio,
                       MAX(aw.week_friday) AS fecha_fin
                FROM projects p
                LEFT JOIN assignments a ON a.project_id = p.id
                LEFT JOIN assignment_weeks aw ON aw.assignment_id = a.id
                GROUP BY p.id, p.name
                ORDER BY p.name
            """)
        ).mappings().all()
        return [dict(r) for r in rows]

@app.get("/api/resources/summary")
def resources_summary():
    with SessionLocal() as s:
        rows = s.execute(
            text("""
                SELECT r.id AS recurso_id, r.name AS nombre,
                       COUNT(aw.id) AS semanas_total,
                       SUM(aw.speculative_pct) AS suma_pct,
                       a.classification AS clasificacion
                FROM resources r
                LEFT JOIN assignments a ON a.resource_id = r.id
                LEFT JOIN assignment_weeks aw ON aw.assignment_id = a.id
                GROUP BY r.id, r.name, a.classification
                ORDER BY r.name
            """)
        ).mappings().all()
        out = {}
        for rec in rows:
            rid = rec["recurso_id"]
            if rid not in out:
                out[rid] = {
                    "recurso_id": rid,
                    "nombre": rec["nombre"],
                    "semanas_total": 0,
                    "por_clasificacion": {}
                }
            out[rid]["semanas_total"] += rec["semanas_total"] or 0
            if rec["clasificacion"]:
                out[rid]["por_clasificacion"][rec["clasificacion"]] = float(rec["suma_pct"] or 0.0)
        return list(out.values())

# Ventana de semanas
@app.get("/api/weeks/window")
def api_weeks_window(start: date, weeks: int = 12):
    start = monday_of(start)
    _, labels = build_window(start, weeks)
    return {"labels": labels, "start_monday": str(start), "weeks": weeks}

# Capacity grid
@app.get("/api/grid/capacity")
def api_grid_capacity(start: date, weeks: int = 12):
    wms, labels = build_window(start, weeks)

    with SessionLocal() as s:
        resources = s.execute(text("SELECT name FROM resources ORDER BY name")).scalars().all()

        rows = s.execute(
            text("""
                SELECT r.name AS recurso,
                       aw.week_monday,
                       SUM(aw.speculative_pct) AS pct
                FROM assignment_weeks aw
                JOIN assignments a ON a.id = aw.assignment_id
                JOIN resources   r ON r.id = a.resource_id
                WHERE aw.week_monday BETWEEN :a AND :b
                GROUP BY r.name, aw.week_monday
            """),
            {"a": wms[0], "b": wms[-1]}
        ).mappings().all()

    by_res = {name: {} for name in resources}

    for r in rows:
        name = r["recurso"]
        wm: date = r["week_monday"]
        label = label_excel(wm)
        pct = float(r["pct"] or 0.0)
        by_res.setdefault(name, {})
        by_res[name][label] = pct

    for name in by_res.keys():
        for lb in labels:
            by_res[name].setdefault(lb, 0.0)

    return {"labels": labels, "by_resource": by_res}

def _empty_bucket(types, labels):
    return {
        "loadByTypeWeek": {t: {lb: 0.0 for lb in labels} for t in types},
        "projectCountByTypeWeek": {t: {lb: 0 for lb in labels} for t in types},
        "projectNamesByType": {t: [] for t in types},
    }

# CORREGIDO: Endpoint único sin duplicación
@app.get("/api/grid/resources-vs")
def api_grid_resources_vs(start: date, weeks: int = 12, resource: Optional[str] = None):
    wms, labels = build_window(start, weeks)
    types = ["Proyecto", "Anteproyecto", "Estrategia", "Admon"]

    with SessionLocal() as s:
        people = s.execute(text("SELECT name FROM resources ORDER BY name")).scalars().all()
        filter_people = [resource] if (resource and resource in people) else people

        rows = s.execute(
            text(f"""
                SELECT r.name AS recurso,
                       p.classification AS tipo,
                       p.id AS project_id,  -- AÑADIR ESTO
                       p.name AS proyecto,
                       aw.week_monday,
                       SUM(aw.speculative_pct) AS pct
                FROM assignment_weeks aw
                JOIN assignments a ON a.id = aw.assignment_id
                JOIN projects    p ON p.id = a.project_id
                JOIN resources   r ON r.id = a.resource_id
                WHERE aw.week_monday BETWEEN :a AND :b
                {"AND r.name = :res" if (resource and resource in people) else ""}
                GROUP BY r.name, p.classification, p.id, p.name, aw.week_monday  -- AÑADIR p.id
            """),
            {"a": wms[0], "b": wms[-1], **({"res": resource} if (resource and resource in people) else {})}
        ).mappings().all()

    by_person = {name: _empty_bucket(types, labels) for name in filter_people}

    for r in rows:
        person = r["recurso"]
        if person not in by_person:
            by_person[person] = _empty_bucket(types, labels)

        tipo = r["tipo"] or "Proyecto"
        project_id = r["project_id"]  # OBTENER EL ID
        proj = r["proyecto"] or "-"
        lb = label_excel(r["week_monday"])
        pct = float(r["pct"] or 0.0)

        by_person[person]["loadByTypeWeek"][tipo][lb] = \
            by_person[person]["loadByTypeWeek"][tipo].get(lb, 0.0) + pct

        by_person[person]["projectCountByTypeWeek"][tipo][lb] = \
            by_person[person]["projectCountByTypeWeek"][tipo].get(lb, 0) + 1

        # MODIFICAR: almacenar objetos con id y nombre en lugar de solo nombres
        current_projects = by_person[person]["projectNamesByType"][tipo]
        # Verificar si ya existe este proyecto (por ID)
        project_exists = any(isinstance(p, dict) and p.get('id') == project_id for p in current_projects)
        if not project_exists:
            current_projects.append({"id": project_id, "name": proj})

    return {
        "labels": labels,
        "types": types,
        "people": people,
        "by_person": by_person,
    }

# Bulk assignments para media/alta complejidad
@app.post("/api/assignments/bulk")
def create_bulk_assignments(payload: dict):
    try:
        project_id = payload.get("project_id")
        resource_id = payload.get("resource_id")
        percentages = payload.get("percentages", [])
        start_date_str = payload.get("start_date")
        complexity_type = payload.get("complexity_type", "alta")
        
        if not project_id or not resource_id or not start_date_str:
            raise HTTPException(400, "Faltan datos requeridos: project_id, resource_id, start_date")
        
        if not percentages:
            raise HTTPException(400, "La lista de porcentajes está vacía")

        start_date = to_date(start_date_str)
        start_monday = monday_of(start_date)
        
        with SessionLocal() as s:
            proj = s.get(Project, project_id)
            res = s.get(Resource, resource_id)
            if not proj or not res:
                raise HTTPException(404, "Proyecto o Recurso no encontrado")
            
            # Verificar capacidad para todas las semanas primero
            week_mondays = [start_monday + timedelta(days=7 * i) for i in range(len(percentages))]
            for i, (wm, pct) in enumerate(zip(week_mondays, percentages)):
                if pct > 0:
                    check_capacity_or_fail(s, resource_id, [wm], pct)
            
            # Crear asignaciones individuales para cada semana
            created_assignments = []
            for i, percentage in enumerate(percentages):
                if percentage > 0:
                    week_monday = start_monday + timedelta(days=7 * i)
                    week_friday = week_monday + timedelta(days=4)
                    
                    assignment = Assignment(
                        project_id=project_id,
                        resource_id=resource_id,
                        start_week_monday=week_monday,
                        end_week_monday=week_monday,
                        subprocess="General",
                        can_ordinal=1,
                        classification=proj.classification,
                        complexity=proj.complexity
                    )
                    s.add(assignment)
                    s.flush()
                    
                    ml = month_label(week_monday)
                    wl = f"Sem {week_index_in_month(week_monday)}"
                    
                    week = AssignmentWeek(
                        assignment_id=assignment.id,
                        week_monday=week_monday,
                        week_friday=week_friday,
                        month_label=ml,
                        week_label=wl,
                        speculative_pct=float(percentage),
                        subprocess="General",
                        can_ordinal=1,
                        project_id=project_id,
                        resource_id=resource_id
                    )
                    s.add(week)
                    created_assignments.append({
                        "week_monday": str(week_monday),
                        "percentage": percentage,
                        "label": f"{ml}:{wl}"
                    })
            
            s.commit()
            
            return {
                "message": f"Se crearon {len(created_assignments)} semanas de asignación",
                "created_assignments": created_assignments,
                "total_weeks": len(percentages),
                "start_date": str(start_monday),
                "complexity_type": complexity_type
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error creando asignaciones múltiples: {str(e)}")

# Delete endpoints
@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: int):
    try:
        with SessionLocal() as db:
            project = db.query(Project).filter(Project.id == project_id).first()
            if not project:
                raise HTTPException(status_code=404, detail="Project not found")
            
            project_name = project.name
            
            db.query(AssignmentWeek).filter(
                AssignmentWeek.project_id == project_id
            ).delete(synchronize_session=False)
            
            db.query(Assignment).filter(
                Assignment.project_id == project_id
            ).delete(synchronize_session=False)
            
            db.delete(project)
            db.commit()
            
            return {
                "message": f"Project '{project_name}' and all associated assignments deleted successfully",
                "deleted_project": project_name
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting project: {str(e)}")

@app.delete("/api/resources/{resource_id}")
async def delete_resource(resource_id: int):
    try:
        with SessionLocal() as db:
            resource = db.query(Resource).filter(Resource.id == resource_id).first()
            if not resource:
                raise HTTPException(status_code=404, detail="Resource not found")
            
            resource_name = resource.name
            
            db.query(AssignmentWeek).filter(
                AssignmentWeek.resource_id == resource_id
            ).delete(synchronize_session=False)
            
            db.query(Assignment).filter(
                Assignment.resource_id == resource_id
            ).delete(synchronize_session=False)
            
            db.delete(resource)
            db.commit()
            
            return {
                "message": f"Resource '{resource_name}' and all associated assignments deleted successfully",
                "deleted_resource": resource_name
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting resource: {str(e)}")

@app.delete("/api/assignments/{assignment_id}")
async def delete_assignment(assignment_id: int):
    try:
        with SessionLocal() as db:
            assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
            if not assignment:
                raise HTTPException(status_code=404, detail="Assignment not found")
            
            db.query(AssignmentWeek).filter(
                AssignmentWeek.assignment_id == assignment_id
            ).delete(synchronize_session=False)
            
            db.delete(assignment)
            db.commit()
            
            return {
                "message": "Assignment and all associated weeks deleted successfully",
                "deleted_assignment_id": assignment_id
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting assignment: {str(e)}")

# Proyectos con assignments
@app.get("/api/projects/with-assignments")
def api_projects_with_assignments():
    with SessionLocal() as s:
        projects = s.query(Project).order_by(Project.name).all()
        
        projects_data = []
        for project in projects:
            has_resource_str = "Sí" if project.has_resource else "No"
            
            projects_data.append({
                "id": project.id,
                "nombre": project.name,
                "classification": project.classification,
                "phase": project.phase,
                "complexity": project.complexity,
                "has_resource": has_resource_str,
                "created_at": project.created_at
            })
        
        return {"projects": projects_data}

# Weekly average para proyectos
@app.get("/api/projects/weekly-avg")
def api_projects_weekly_avg(start: date, weeks: int = 12):
    """
    Devuelve el promedio semanal de carga por proyecto, dentro de la ventana
    """
    wms, labels = build_window(start, weeks)

    with SessionLocal() as s:
        # CORREGIR esta consulta - estaba usando LEFT JOIN de forma incorrecta
        rows = s.execute(
            text("""
                SELECT p.name AS proyecto,
                       aw.week_monday AS week_monday,
                       COALESCE(SUM(aw.speculative_pct), 0.0) AS pct
                FROM projects p
                LEFT JOIN assignments a ON a.project_id = p.id
                LEFT JOIN assignment_weeks aw ON aw.assignment_id = a.id
                     AND aw.week_monday BETWEEN :a AND :b
                WHERE aw.week_monday BETWEEN :a AND :b OR aw.week_monday IS NULL
                GROUP BY p.name, aw.week_monday
                ORDER BY p.name, aw.week_monday
            """),
            {"a": wms[0], "b": wms[-1]}
        ).mappings().all()

    # bucket por proyecto
    per_proj = {}
    for r in rows:
        name = r["proyecto"]
        wm = r["week_monday"]
        if name not in per_proj:
            per_proj[name] = {"by_week": {lb: 0.0 for lb in labels}}
        if wm is not None:
            per_proj[name]["by_week"][label_excel(wm)] += float(r["pct"] or 0.0)

    # asegurar que también salgan proyectos sin semanas en la ventana
    with SessionLocal() as s:
        all_projects = s.execute(text("SELECT name FROM projects")).scalars().all()
    for pname in all_projects:
        per_proj.setdefault(pname, {"by_week": {lb: 0.0 for lb in labels}})

    projects = []
    for name, data in per_proj.items():
        vals = [float(data["by_week"].get(lb, 0.0)) for lb in labels]
        avg = (sum(vals) / len(vals)) if labels else 0.0
        projects.append({"name": name, "avg_pct": avg, "by_week": data["by_week"]})

    # ordenar por mayor promedio
    projects.sort(key=lambda x: x["avg_pct"], reverse=True)
    return {"labels": labels, "projects": projects}

# NUEVO: Endpoint para obtener subprocesos del mes actual
# Endpoint corregido para filtrar subprocesos por proyecto Y recurso
# CORREGIR: Endpoint para obtener subprocesos por proyecto Y recurso
@app.get("/api/projects/{project_id}/subprocesses/current-month")
def get_project_subprocesses_current_month(project_id: int, resource_name: Optional[str] = None):
    """Obtiene los subprocesos únicos de un proyecto PARA UN RECURSO ESPECÍFICO en el mes actual"""
    try:
        # Obtener el primer y último día del mes actual
        today = datetime.now(TZ).date()
        first_day = today.replace(day=1)
        next_month = first_day.replace(day=28) + timedelta(days=4)
        last_day = next_month - timedelta(days=next_month.day)
        
        with SessionLocal() as s:
            # Verificar que el proyecto existe
            project = s.get(Project, project_id)
            if not project:
                raise HTTPException(404, "Proyecto no encontrado")
            
            # Construir query base
            query = s.query(
                AssignmentWeek.subprocess,
                func.count(AssignmentWeek.id).label('count')
            ).join(
                Assignment, Assignment.id == AssignmentWeek.assignment_id
            ).join(
                Resource, Resource.id == Assignment.resource_id
            ).filter(
                AssignmentWeek.project_id == project_id,
                AssignmentWeek.week_monday >= first_day,
                AssignmentWeek.week_monday <= last_day
            )
            
            # FILTRAR POR RECURSO SI SE PROVEE
            if resource_name and resource_name != "Todos":
                query = query.filter(Resource.name == resource_name)
            
            # Si es proyecto de media/alta complejidad, excluir subprocesos por defecto
            if project.complexity.lower() in ["media", "alta"]:
                query = query.filter(
                    ~AssignmentWeek.subprocess.in_(["General", "Requerimientos | Desarrollos", "Requerimientos | Desarrollos | Directivo"])
                )
            
            subprocesses = query.group_by(
                AssignmentWeek.subprocess
            ).order_by(
                AssignmentWeek.subprocess
            ).all()
            
            return {
                "project_id": project_id,
                "project_name": project.name,
                "resource_name": resource_name,
                "complexity": project.complexity,
                "current_month": today.strftime("%Y-%m"),
                "subprocesses": [{"name": sp[0], "count": sp[1]} for sp in subprocesses]
            }
            
    except Exception as e:
        print(f"❌ Error en get_project_subprocesses_current_month: {str(e)}")
        traceback.print_exc()
        raise HTTPException(500, f"Error obteniendo subprocesos: {str(e)}")
    
# En tu main.py - NUEVO ENDPOINT CORREGIDO
@app.post("/api/assignments/bulk-with-subprocesses")
def create_bulk_assignments_with_subprocesses(payload: dict):
    try:
        project_id = payload.get("project_id")
        resource_id = payload.get("resource_id")
        percentages = payload.get("percentages", [])
        subprocesses = payload.get("subprocesses", [])  # NUEVO: lista de subprocesos
        start_date_str = payload.get("start_date")
        complexity_type = payload.get("complexity_type", "alta")
        
        if not project_id or not resource_id or not start_date_str:
            raise HTTPException(400, "Faltan datos requeridos: project_id, resource_id, start_date")
        
        if not percentages:
            raise HTTPException(400, "La lista de porcentajes está vacía")
        
        # Validar que percentages y subprocesses tengan la misma longitud
        if subprocesses and len(percentages) != len(subprocesses):
            raise HTTPException(400, "La lista de porcentajes y subprocesos deben tener la misma longitud")

        start_date = to_date(start_date_str)
        start_monday = monday_of(start_date)
        
        with SessionLocal() as s:
            proj = s.get(Project, project_id)
            res = s.get(Resource, resource_id)
            if not proj or not res:
                raise HTTPException(404, "Proyecto o Recurso no encontrado")
            
            # Verificar capacidad para todas las semanas primero
            week_mondays = [start_monday + timedelta(days=7 * i) for i in range(len(percentages))]
            for i, (wm, pct) in enumerate(zip(week_mondays, percentages)):
                if pct > 0:
                    check_capacity_or_fail(s, resource_id, [wm], pct)
            
            # Crear asignaciones individuales para cada semana
            created_assignments = []
            for i, percentage in enumerate(percentages):
                if percentage > 0:
                    week_monday = start_monday + timedelta(days=7 * i)
                    week_friday = week_monday + timedelta(days=4)
                    
                    # Obtener el subproceso específico para esta semana, o "General" por defecto
                    subprocess = subprocesses[i] if i < len(subprocesses) else "General"
                    
                    assignment = Assignment(
                        project_id=project_id,
                        resource_id=resource_id,
                        start_week_monday=week_monday,
                        end_week_monday=week_monday,
                        subprocess=subprocess,  # USAR SUBPROCESO ESPECÍFICO
                        can_ordinal=1,
                        classification=proj.classification,
                        complexity=proj.complexity
                    )
                    s.add(assignment)
                    s.flush()
                    
                    ml = month_label(week_monday)
                    wl = f"Sem {week_index_in_month(week_monday)}"
                    
                    week = AssignmentWeek(
                        assignment_id=assignment.id,
                        week_monday=week_monday,
                        week_friday=week_friday,
                        month_label=ml,
                        week_label=wl,
                        speculative_pct=float(percentage),
                        subprocess=subprocess,  # USAR SUBPROCESO ESPECÍFICO
                        can_ordinal=1,
                        project_id=project_id,
                        resource_id=resource_id
                    )
                    s.add(week)
                    created_assignments.append({
                        "week_monday": str(week_monday),
                        "percentage": percentage,
                        "subprocess": subprocess,  # INCLUIR EN RESPUESTA
                        "label": f"{ml}:{wl}"
                    })
            
            s.commit()
            
            return {
                "message": f"Se crearon {len(created_assignments)} semanas de asignación",
                "created_assignments": created_assignments,
                "total_weeks": len(percentages),
                "start_date": str(start_monday),
                "complexity_type": complexity_type
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error creando asignaciones múltiples: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
