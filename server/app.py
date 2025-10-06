import os
import uuid
from decimal import Decimal

from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import (
    create_engine, Column, String, Text, Numeric, DateTime, func
)
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.exc import SQLAlchemyError

# -------------------------
# Config
# -------------------------
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL env var is required")

# Render sometimes provides 'postgres://'; SQLAlchemy expects 'postgresql://'
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

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

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    item = Column(Text, nullable=False)
    model = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    vendor = Column(Text, nullable=False)
    multiplier = Column(Numeric(12, 4), nullable=True)  # store as DECIMAL
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "item": self.item,
            "model": self.model,
            "description": self.description,
            "vendor": self.vendor,
            # Convert Decimal -> float for JSON
            "multiplier": float(self.multiplier) if isinstance(self.multiplier, (Decimal, float)) else None,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# Create tables if they don't exist
Base.metadata.create_all(engine)

app = Flask(__name__)

# Allow your frontend; set FRONTEND_ORIGIN in Render if you want to restrict
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


@app.post("/macros")
def create_macro():
    data = request.get_json(force=True) or {}
    # Basic validation
    for field in ("item", "model", "description", "vendor"):
        if not str(data.get(field, "")).strip():
            return jsonify({"error": f"{field} is required"}), 400

    mult = data.get("multiplier", None)
    if mult in ("", None):
        mult_val = None
    else:
        try:
            mult_val = Decimal(str(mult))
        except Exception:
            return jsonify({"error": "multiplier must be numeric"}), 400

    macro = Macro(
        item=str(data["item"]).strip(),
        model=str(data["model"]).strip(),
        description=str(data["description"]).strip(),
        vendor=str(data["vendor"]).strip(),
        multiplier=mult_val,
        notes=(str(data["notes"]).strip() if data.get("notes") else None),
    )
    try:
        with SessionLocal() as db:
            db.add(macro)
            db.commit()
            db.refresh(macro)
            return jsonify(macro.to_dict()), 201
    except SQLAlchemyError as e:
        return jsonify({"error": str(e)}), 500


@app.put("/macros/<id>")
def update_macro(id):
    data = request.get_json(force=True) or {}
    for field in ("item", "model", "description", "vendor"):
        if not str(data.get(field, "")).strip():
            return jsonify({"error": f"{field} is required"}), 400

    mult = data.get("multiplier", None)
    if mult in ("", None):
        mult_val = None
    else:
        try:
            mult_val = Decimal(str(mult))
        except Exception:
            return jsonify({"error": "multiplier must be numeric"}), 400

    try:
        with SessionLocal() as db:
            macro = db.query(Macro).get(id)
            if not macro:
                return jsonify({"error": "not found"}), 404

            macro.item = str(data["item"]).strip()
            macro.model = str(data["model"]).strip()
            macro.description = str(data["description"]).strip()
            macro.vendor = str(data["vendor"]).strip()
            macro.multiplier = mult_val
            macro.notes = (str(data["notes"]).strip() if data.get("notes") else None)

            db.commit()
            db.refresh(macro)
            return jsonify(macro.to_dict())
    except SQLAlchemyError as e:
        return jsonify({"error": str(e)}), 500


@app.delete("/macros/<id>")
def delete_macro(id):
    try:
        with SessionLocal() as db:
            macro = db.query(Macro).get(id)
            if not macro:
                return jsonify({"error": "not found"}), 404
            db.delete(macro)
            db.commit()
            return jsonify({"ok": True})
    except SQLAlchemyError as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # Local dev: python app.py
    port = int(os.getenv("PORT", "8787"))
    app.run(host="0.0.0.0", port=port, debug=True)
