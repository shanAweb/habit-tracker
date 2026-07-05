"use client";

import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import type { NewHabit } from "../lib/types";

const colors = ["#f97316", "#16a34a", "#2563eb", "#db2777"];

export function HabitForm({ onAdd }: { onAdd: (habit: NewHabit) => Promise<void> }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Personal");
  const [color, setColor] = useState(colors[0]);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onAdd({ name, category, color });
      setName("");
      setCategory("Personal");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="panel form-grid" onSubmit={handleSubmit}>
      <label className="field">
        Habit
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Read for 20 minutes"
        />
      </label>
      <label className="field">
        Category
        <input
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          placeholder="Health"
        />
      </label>
      <label className="field">
        Color
        <input
          aria-label="Habit color"
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
        />
      </label>
      <button className="button" disabled={saving} type="submit">
        <Plus size={17} /> {saving ? "Adding" : "Add"}
      </button>
    </form>
  );
}
