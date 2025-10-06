import { useEffect, useState } from "react";

const BLANK = {
  id: null,
  item: "",
  model: "",
  description: "",
  vendor: "",
  multiplier: "",
  notes: "",
};

export default function MacroForm({ onSubmit, editingItem, onCancelEdit }) {
  const [form, setForm] = useState(BLANK);

  useEffect(() => {
    if (editingItem) setForm({ ...BLANK, ...editingItem });
    else setForm(BLANK);
  }, [editingItem]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function validate() {
    const errs = [];
    if (!form.item.trim()) errs.push("Item is required.");
    if (!form.model.trim()) errs.push("Model is required.");
    if (!form.description.trim()) errs.push("Description is required.");
    if (!form.vendor.trim()) errs.push("Vendor is required.");
    // Multiplier optional
    if (form.multiplier !== "" && isNaN(Number(form.multiplier))) {
      errs.push("Multiplier must be a number if provided.");
    }
    return errs;
  }

  function submit(e) {
    e.preventDefault();
    const errors = validate();
    if (errors.length) {
      alert(errors.join("\n"));
      return;
    }
    const payload = {
      id: form.id ?? crypto.randomUUID(),
      item: form.item.trim(),
      model: form.model.trim(),
      description: form.description.trim(),
      vendor: form.vendor.trim(),
      multiplier: form.multiplier === "" ? null : Number(form.multiplier),
      notes: form.notes.trim(),
    };
    onSubmit(payload);
    setForm(BLANK);
  }

  return (
    <form className="card" onSubmit={submit}>
      <div className="grid">
        <label className="span-2">
          <span>Item*</span>
          <input name="item" value={form.item} onChange={handleChange} required />
        </label>

        <label>
          <span>Model*</span>
          <input name="model" value={form.model} onChange={handleChange} required />
        </label>

        <label>
          <span>Vendor*</span>
          <input name="vendor" value={form.vendor} onChange={handleChange} required />
        </label>

        <label className="span-3">
          <span>Description*</span>
          <input name="description" value={form.description} onChange={handleChange} required />
        </label>

        <label>
          <span>Multiplier (optional)</span>
          <input
            name="multiplier"
            value={form.multiplier}
            onChange={handleChange}
            inputMode="decimal"
            placeholder="e.g. 0.39"
          />
        </label>

        <label className="span-6">
          <span>Notes</span>
          <input name="notes" value={form.notes} onChange={handleChange} placeholder="Extra info…" />
        </label>
      </div>

      <div className="actions">
        <button type="submit" className="btn primary">
          {form.id ? "Save Changes" : "Add Item"}
        </button>
        {form.id && (
          <button type="button" className="btn" onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
