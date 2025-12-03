"use client";

import { useState } from "react";
import type { PublisherFormConfig, PublisherFormConfigSection } from "./types";

type AdminPublisherFormEditorProps = {
  initialConfig: PublisherFormConfig | null;
  onSave: (config: PublisherFormConfig) => Promise<void>;
};

export function AdminPublisherFormEditor({
  initialConfig,
  onSave,
}: AdminPublisherFormEditorProps) {
  const [config, setConfig] = useState<PublisherFormConfig>(
    initialConfig || {
      id: "",
      version: 1,
      isActive: true,
      sections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(config);
      alert("Configuration saved successfully");
    } catch (error) {
      alert(`Error saving: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const addSection = () => {
    const newSection: PublisherFormConfigSection = {
      id: `section-${Date.now()}`,
      title: "New Section",
      fields: [],
    };
    setConfig({
      ...config,
      sections: [...config.sections, newSection],
    });
  };

  const updateSection = (index: number, updates: Partial<PublisherFormConfigSection>) => {
    const sections = [...config.sections];
    sections[index] = { ...sections[index], ...updates };
    setConfig({ ...config, sections });
  };

  const deleteSection = (index: number) => {
    const sections = config.sections.filter((_, i) => i !== index);
    setConfig({ ...config, sections });
  };

  const addField = (sectionIndex: number) => {
    const sections = [...config.sections];
    sections[sectionIndex].fields.push({
      id: `field-${Date.now()}`,
      type: "text",
      label: "New Field",
    });
    setConfig({ ...config, sections });
  };

  const updateField = (
    sectionIndex: number,
    fieldIndex: number,
    updates: Partial<PublisherFormConfigSection["fields"][0]>
  ) => {
    const sections = [...config.sections];
    sections[sectionIndex].fields[fieldIndex] = {
      ...sections[sectionIndex].fields[fieldIndex],
      ...updates,
    };
    setConfig({ ...config, sections });
  };

  const deleteField = (sectionIndex: number, fieldIndex: number) => {
    const sections = [...config.sections];
    sections[sectionIndex].fields = sections[sectionIndex].fields.filter(
      (_, i) => i !== fieldIndex
    );
    setConfig({ ...config, sections });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Publisher Form Configuration</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Configuration"}
        </button>
      </div>

      <div className="space-y-4">
        {config.sections.map((section, sectionIndex) => (
          <div key={section.id} className="border rounded-md p-4 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) =>
                    updateSection(sectionIndex, { title: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md text-lg font-semibold"
                  placeholder="Section Title"
                />
                <textarea
                  value={section.description || ""}
                  onChange={(e) =>
                    updateSection(sectionIndex, { description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="Section Description (optional)"
                  rows={2}
                />
              </div>
              <button
                onClick={() => deleteSection(sectionIndex)}
                className="ml-4 px-3 py-1 text-red-600 border border-red-600 rounded-md hover:bg-red-50"
              >
                Delete Section
              </button>
            </div>

            <div className="space-y-2">
              {section.fields.map((field, fieldIndex) => (
                <div
                  key={field.id}
                  className="border rounded-md p-3 bg-slate-50 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <select
                      value={field.type}
                      onChange={(e) =>
                        updateField(sectionIndex, fieldIndex, {
                          type: e.target.value as any,
                        })
                      }
                      className="px-2 py-1 border rounded-md text-sm"
                    >
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="textarea">Textarea</option>
                      <option value="select">Select</option>
                      <option value="file">File</option>
                      <option value="checkbox">Checkbox</option>
                    </select>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) =>
                        updateField(sectionIndex, fieldIndex, { label: e.target.value })
                      }
                      className="flex-1 px-2 py-1 border rounded-md text-sm"
                      placeholder="Field Label"
                    />
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={field.required || false}
                        onChange={(e) =>
                          updateField(sectionIndex, fieldIndex, {
                            required: e.target.checked,
                          })
                        }
                      />
                      Required
                    </label>
                    <button
                      onClick={() => deleteField(sectionIndex, fieldIndex)}
                      className="px-2 py-1 text-red-600 text-sm hover:bg-red-50 rounded"
                    >
                      Delete
                    </button>
                  </div>
                  {field.type !== "checkbox" && (
                    <input
                      type="text"
                      value={field.placeholder || ""}
                      onChange={(e) =>
                        updateField(sectionIndex, fieldIndex, {
                          placeholder: e.target.value,
                        })
                      }
                      className="w-full px-2 py-1 border rounded-md text-sm"
                      placeholder="Placeholder (optional)"
                    />
                  )}
                  {field.type === "select" && (
                    <div className="text-xs text-slate-600">
                      Options: {field.options?.map((o) => o.label).join(", ") || "None"}
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={() => addField(sectionIndex)}
                className="w-full px-3 py-2 border border-dashed rounded-md text-sm text-slate-600 hover:bg-slate-100"
              >
                + Add Field
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={addSection}
          className="w-full px-4 py-3 border border-dashed rounded-md text-slate-600 hover:bg-slate-50"
        >
          + Add Section
        </button>
      </div>
    </div>
  );
}

