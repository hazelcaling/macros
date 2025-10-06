import os
import uuid
from decimal import Decimal

from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import (
    create_engine, Column, String, Text, Numeric, DateTime, func, text
)
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.exc import SQLAlchemyError

# -------------------------
# Config
# -------------------------
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL env var is required")

# Explicit schema (defaults to "public")
DB_SCHEMA = os.getenv("DB_SCHEMA", "public")

# Use psycopg v3 driver with SQLAlchemy
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


class Macro(Base):
    __tablename__ = "macros"
    __table_args__ = {"schema": DB_SCHEMA}  # <-- ensure table is created in the schema

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    item = Column(Text, nullable=False)
    model = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    vendor = Column(Text, nullable=False)
    multiplier = Column(Numeric(12, 4), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "item": self.item,
            "model": self.model,
            "description": self.description,
            "vendor": self.vendor,
            "multiplier": float(self.multiplier) if self.multiplier is not None else None,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# Ensure schema exists, then create tables
with engine.begin() as conn:
    # Create schema if missing (safe to run repeatedly)
    conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{DB_SCHEMA}"'))
    # Optional: set search_path for this connection so ad-hoc queries also work
    conn.execute(text(f'SET search_path TO "{DB_SCHEMA}"'))
Base.metadata.create_all(engine)

app = Flask(__name__)
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN")
CORS(app, resources={r"/*": {"origins": FRONTEND_ORIGIN or "*"}})


@app.get("/health")
def health():
    return jsonify({"ok": True})


@app.get("/macros")
def list_macros():
    with SessionLocal() as db:
        rows = db.query(Macro).order_by(Macro.created_at.asc()).all()
        return jsonify([m.to_dict() for m in rows])


def _validate(p):
    for f in ("item", "model", "description", "vendor"):
        if not str(p.get(f, "")).strip():
            return f"{f} is required"
    m = p.get("multiplier", None)
    if m not in ("", None):
        try:
            float(m)
        except Exception:
            return "multiplier must be numeric if provided"
    return None


def _normalize(p):
    return {
        "item": str(p["item"]).strip(),
        "model": str(p["model"]).strip(),
        "description": str(p["description"]).strip(),
        "vendor": str(p["vendor"]).strip(),
        "multiplier": (Decimal(str(p["multiplier"])) if p.get("multiplier") not in ("", None) else None),
        "notes": (str(p["notes"]).strip() if p.get("notes") else None),
    }


@app.post("/macros")
def create_macro():
    data = request.get_json(force=True) or {}
    err = _validate(data)
    if err:
        return jsonify({"error": err}), 400

    rec = Macro(**_normalize(data))
    try:
        with SessionLocal() as db:
            db.add(rec)
            db.commit()
            db.refresh(rec)
            return jsonify(rec.to_dict()), 201
    except SQLAlchemyError as e:
        return jsonify({"error": str(e)}), 500


@app.put("/macros/<id>")
def update_macro(id):
    data = request.get_json(force=True) or {}
    err = _validate(data)
    if err:
        return jsonify({"error": err}), 400

    try:
        with SessionLocal() as db:
            rec = db.get(Macro, id)
            if not rec:
                return jsonify({"error": "not found"}), 404

            norm = _normalize(data)
            rec.item = norm["item"]
            rec.model = norm["model"]
            rec.description = norm["description"]
            rec.vendor = norm["vendor"]
            rec.multiplier = norm["multiplier"]
            rec.notes = norm["notes"]

            db.commit()
            db.refresh(rec)
            return jsonify(rec.to_dict())
    except SQLAlchemyError as e:
        return jsonify({"error": str(e)}), 500


@app.delete("/macros/<id>")
def delete_macro(id):
    try:
        with SessionLocal() as db:
            rec = db.get(Macro, id)
            if not rec:
                return jsonify({"error": "not found"}), 404
            db.delete(rec)
            db.commit()
            return jsonify({"ok": True})
    except SQLAlchemyError as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8787"))
    app.run(host="0.0.0.0", port=port, debug=True)
