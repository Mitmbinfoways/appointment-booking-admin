"use client";

import React, { useState, useEffect } from "react";
import PageMeta from "@/components/PageMeta";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import Button from "@/components/UI/Button";
import { getAdminFormConfig, updateAdminFormConfig } from "@/config/AxiosConfig";
import { Toast } from "@/components/Toast";
import { useRouter } from "next/navigation";
import { Pencil, Check, Trash2, Plus, X } from "lucide-react";

const FIELD_TYPES = ["text", "number", "email", "tel", "date", "textarea", "image", "video"];

export default function AdminFormConfigPage() {
  const router = useRouter();

  const [formFields, setFormFields] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isEditingForm, setIsEditingForm] = useState(false);

  const fetchFormConfig = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminFormConfig();
      if (res.status === 200 && res.data?.statusCode === 200) {
        // Sort fields initially by order before displaying
        const sorted = (res.data.data.fields || []).sort((a, b) => a.order - b.order);
        setFormFields(sorted);
      } else {
        Toast({ message: "Failed to load form config.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      Toast({ message: "Connection error loading config.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFormConfig();
  }, []);

  const handleAddField = () => {
    setFormFields((prev) => [
      ...prev,
      {
        fieldKey: `custom_field_${prev.length + 1}`,
        label: `Custom Field ${prev.length + 1}`,
        type: "text",
        required: false,
        order: prev.length,
      },
    ]);
    setIsEditingForm(true);
  };

  const handleRemoveField = (index) => {
    setFormFields((prev) => {
      const filtered = prev.filter((_, idx) => idx !== index);
      // Re-assign correct orders after removal
      return filtered.map((f, idx) => ({ ...f, order: idx }));
    });
  };

  const handleFieldChange = (index, field, value) => {
    setFormFields((prev) =>
      prev.map((f, idx) => (idx === index ? { ...f, [field]: value } : f))
    );
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const items = [...formFields];
    const draggedItem = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(index, 0, draggedItem);

    // Dynamic re-sequencing of the fields' order property
    const updatedItems = items.map((item, idx) => ({
      ...item,
      order: idx,
    }));

    setDraggedIndex(index);
    setFormFields(updatedItems);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Validate that all field labels are non-empty
    for (const f of formFields) {
      if (!f.label || f.label.trim() === "") {
        Toast({ message: "Field labels cannot be empty.", type: "error" });
        return;
      }
    }

    setIsSaving(true);
    try {
      const res = await updateAdminFormConfig({ fields: formFields });
      if (res.status === 200 && res.data?.statusCode === 200) {
        Toast({ message: "Form configuration saved successfully.", type: "success" });
        setIsEditingForm(false);
      } else {
        Toast({ message: "Failed to update form configuration.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      Toast({ message: "Connection error saving configuration.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingForm(false);
    fetchFormConfig();
  };

  return (
    <>
      <PageMeta title="Configure Booking Form" description="Admin Booking Form Config Panel" />
      <PageBreadcrumb
        items={[
          { label: "Home", to: "/" },
          { label: "Form Configuration", to: "/settings/form" }
        ]}
      />

      <div className="bg-white rounded-lg border border-gray-200 shadow-theme-xs p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Custom Booking Form</h3>
            <p className="text-sm text-gray-500">Configure dynamic inputs by adding fields and dragging them to reorder.</p>
          </div>

          <div className="flex items-center gap-3">
            {!isEditingForm ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => setIsEditingForm(true)}
                className="flex items-center gap-1.5"
              >
                <Pencil size={15} /> Edit Form
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white"
              >
                <Check size={16} /> {isSaving ? "Saving..." : "Save Form"}
              </Button>
            )}

            <Button type="button" variant="secondary" size="md" onClick={handleAddField} className="flex items-center gap-1">
              <Plus size={15} /> Add Field
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {isLoading ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              Loading form settings...
            </div>
          ) : formFields.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
              No custom form fields created. Click "Add Field" to construct a dynamic form schema.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {formFields.map((field, index) => {
                const isDragging = draggedIndex === index;

                return (
                  <div
                    key={index}
                    draggable={isEditingForm}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 transition-all duration-150 ${
                      isDragging ? "opacity-40 border-dashed border-blue-400 bg-blue-50/20" : ""
                    }`}
                  >
                    {/* Drag Handle Grip Icon */}
                    {isEditingForm && (
                      <div className="text-gray-400 cursor-grab active:cursor-grabbing hover:text-gray-600 p-1 shrink-0">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="9" cy="5" r="1" />
                          <circle cx="9" cy="12" r="1" />
                          <circle cx="9" cy="19" r="1" />
                          <circle cx="15" cy="5" r="1" />
                          <circle cx="15" cy="12" r="1" />
                          <circle cx="15" cy="19" r="1" />
                        </svg>
                      </div>
                    )}

                    {isEditingForm ? (
                      // EDITABLE FIELDS VIEW
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full items-center">
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Label</label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => handleFieldChange(index, "label", e.target.value)}
                            required
                            className="w-full px-3 py-1.5 border border-blue-400 ring-2 ring-blue-500/10 rounded-lg text-sm focus:outline-none bg-white font-medium text-gray-800"
                            placeholder="Enter Field Label"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Type</label>
                            <select
                              value={field.type}
                              onChange={(e) => handleFieldChange(index, "type", e.target.value)}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none font-medium text-gray-800"
                            >
                              {FIELD_TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center gap-1.5 pt-4">
                            <input
                              type="checkbox"
                              id={`req-${index}`}
                              checked={field.required}
                              onChange={(e) => handleFieldChange(index, "required", e.target.checked)}
                              className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <label htmlFor={`req-${index}`} className="text-sm font-semibold text-gray-700 select-none cursor-pointer">Req</label>
                          </div>
                          <div className="pt-4 flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleRemoveField(index)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Field"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // READ-ONLY TEXT VIEW
                      <div className="flex items-center justify-between w-full gap-4">
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="text-sm font-bold text-gray-900 min-w-36">{field.label}</span>
                          <span className="px-2.5 py-1 text-xs font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                            {field.type}
                          </span>
                          {field.required ? (
                            <span className="px-2.5 py-0.5 text-[11px] font-bold bg-red-50 text-red-600 border border-red-200 rounded-full">
                              Required
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium">
                              Optional
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {isEditingForm && (
            <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
              <Button type="button" variant="secondary" size="md" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1.5">
                <Check size={16} /> {isSaving ? "Saving..." : "Save Form"}
              </Button>
            </div>
          )}
        </form>
      </div>
    </>
  );
}
