"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CustomModal } from "./Modal";
import Button from "./Button";
import { Toast } from "@/components/Toast";
import {
  getUserModulesApi,
  getMedicinesListApi,
  getPrescriptionByBookingApi,
  savePrescriptionApi,
} from "@/config/AxiosConfig";
import {
  Plus,
  Trash2,
  Printer,
  Download,
  Stethoscope,
  Pill,
} from "lucide-react";

export default function PrescriptionModal({ isOpen, onClose, booking, admin }) {
  const adminId =
    admin?._id ||
    (typeof window !== "undefined" ? localStorage.getItem("adminId") : null);

  const [hasMedicineModule, setHasMedicineModule] = useState(false);
  const [catalogMedicines, setCatalogMedicines] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [medicines, setMedicines] = useState([]);

  // Check module access & fetch data
  const initModalData = useCallback(async () => {
    if (!booking || !adminId) return;
    setIsLoading(true);
    try {
      // 1. Check medicine module access
      let hasMed = false;
      const modRes = await getUserModulesApi(adminId);
      if (modRes.status === 200 && modRes.data?.data) {
        hasMed = Boolean(modRes.data.data.medicineModule);
      } else {
        hasMed = true; // default enabled
      }
      setHasMedicineModule(hasMed);

      // 2. Fetch catalog medicines if module enabled
      if (hasMed) {
        const catRes = await getMedicinesListApi(adminId);
        if (catRes.status === 200 && catRes.data?.data) {
          setCatalogMedicines(catRes.data.data);
        }
      }

      // 3. Fetch existing prescription
      const presRes = await getPrescriptionByBookingApi(
        booking._id || booking.bookingId,
      );
      if (presRes.status === 200 && presRes.data?.data) {
        const pres = presRes.data.data;
        setDiagnosis(pres.diagnosis || "");
        setNotes(pres.notes || "");
        if (Array.isArray(pres.medicines) && pres.medicines.length > 0) {
          setMedicines(
            pres.medicines.map((m) => ({
              medicineId: m.medicineId?._id || m.medicineId || "",
              isCustom: Boolean(m.isCustom),
              name: m.name || "",
              dosage: m.dosage || "",
              frequency: m.frequency || "1-0-1",
              duration: m.duration || "5 Days",
              instructions: m.instructions || "",
              quantity: m.quantity || 1,
              timing: m.timing || "After Food",
            })),
          );
        } else {
          setMedicines([
            {
              medicineId: "",
              isCustom: !hasMed,
              name: "",
              dosage: "",
              frequency: "1-0-1",
              duration: "5 Days",
              instructions: "",
              quantity: 1,
              timing: "After Food",
            },
          ]);
        }
      } else {
        setDiagnosis("");
        setNotes("");
        setMedicines([
          {
            medicineId: "",
            isCustom: !hasMed,
            name: "",
            dosage: "",
            frequency: "1-0-1",
            duration: "5 Days",
            instructions: "",
            quantity: 1,
            timing: "After Food",
          },
        ]);
      }
    } catch (err) {
      console.error("Error initializing prescription modal:", err);
    } finally {
      setIsLoading(false);
    }
  }, [booking, adminId]);

  useEffect(() => {
    if (isOpen) {
      initModalData();
    }
  }, [isOpen, initModalData]);

  const handleAddMedicineRow = () => {
    setMedicines((prev) => [
      ...prev,
      {
        medicineId: "",
        isCustom: !hasMedicineModule,
        name: "",
        dosage: "",
        frequency: "1-0-1",
        duration: "5 Days",
        instructions: "",
        quantity: 1,
        timing: "After Food",
      },
    ]);
  };

  const handleRemoveMedicineRow = (index) => {
    setMedicines((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleMedicineSelectChange = (index, medicineId) => {
    if (!medicineId || medicineId === "custom") {
      setMedicines((prev) =>
        prev.map((item, idx) =>
          idx === index
            ? { ...item, medicineId: "", isCustom: true, name: "", dosage: "" }
            : item,
        ),
      );
    } else {
      const selected = catalogMedicines.find((m) => m._id === medicineId);
      if (selected) {
        setMedicines((prev) =>
          prev.map((item, idx) =>
            idx === index
              ? {
                  ...item,
                  medicineId: selected._id,
                  isCustom: false,
                  name: selected.name,
                  dosage: selected.dosage || "",
                }
              : item,
          ),
        );
      }
    }
  };

  const handleFieldChange = (index, field, value) => {
    setMedicines((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleSavePrescription = async () => {
    if (!booking) return;

    // Validate medicines
    const validMedicines = medicines.filter(
      (m) => m.name && m.name.trim() !== "",
    );
    if (validMedicines.length === 0) {
      Toast({
        message: "Please add at least one valid medicine name.",
        type: "error",
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        bookingId: booking._id || booking.bookingId,
        adminId,
        patientName:
          `${booking.firstName || ""} ${booking.lastName || ""}`.trim() ||
          booking.name ||
          "Patient",
        patientEmail: booking.email || "",
        patientPhone: booking.phoneNumber || booking.phone || "",
        doctorName: admin?.username || "Doctor",
        businessName: admin?.businessName || "Medical Clinic",
        diagnosis,
        notes,
        medicines: validMedicines,
      };

      const res = await savePrescriptionApi(payload);
      if (res.status === 200) {
        Toast({
          message: "Prescription issued and stock updated successfully!",
          type: "success",
        });
        onClose();
      } else {
        Toast({
          message: res.data?.message || "Failed to save prescription",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error saving prescription:", err);
      Toast({ message: "Failed to save prescription.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (typeof window === "undefined" || !booking) return;

    setIsDownloadingPDF(true);
    Toast({ message: "Generating PDF document...", type: "info" });

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const patientNameStr =
        `${booking.firstName || ""} ${booking.lastName || ""}`.trim() ||
        booking.name ||
        "Patient";

      const patientSlug = patientNameStr.replace(/\s+/g, "_");
      const filename = `Prescription_${patientSlug}_${booking.bookingId || booking._id}.pdf`;

      // Build dedicated off-screen printable div with explicit styles
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "fixed";
      tempDiv.style.top = "0";
      tempDiv.style.left = "-9999px";
      tempDiv.style.width = "794px";
      tempDiv.style.backgroundColor = "#ffffff";
      tempDiv.style.color = "#0f172a";
      tempDiv.style.padding = "36px";
      tempDiv.style.fontFamily = "Arial, sans-serif";
      tempDiv.style.boxSizing = "border-box";
      tempDiv.style.zIndex = "-99999";

      const medicinesListHtml = medicines
        .map(
          (m, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; font-weight: 600; color: #475569;">${idx + 1}</td>
          <td style="padding: 10px; font-weight: 700; color: #0f172a;">${m.name} ${m.dosage ? `(${m.dosage})` : ""}</td>
          <td style="padding: 10px; font-weight: 600; color: #334155;">${m.frequency}</td>
          <td style="padding: 10px; color: #334155;">${m.duration}</td>
          <td style="padding: 10px; color: #475569;">${m.timing || "After Food"}</td>
          <td style="padding: 10px; color: #475569;">${m.instructions || "--"}</td>
          <td style="padding: 10px; text-align: center; font-weight: 700; color: #0f172a;">${m.quantity}</td>
        </tr>
      `,
        )
        .join("");

      tempDiv.innerHTML = `
        <div style="font-family: Arial, sans-serif; color: #0f172a;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px;">
            <div>
              <h1 style="font-size: 24px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 1px; color: #0f172a;">
                ${admin?.businessName || "MEDICAL CLINIC"}
              </h1>
              <p style="font-size: 13px; color: #475569; margin: 4px 0 0 0; font-weight: 600;">
                Doctor: Dr. ${admin?.username || "John Doe"}
              </p>
            </div>
          </div>

          ${
            diagnosis
              ? `
            <div style="margin-bottom: 20px;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; display: block; margin-bottom: 4px;">Diagnosis / Medical Condition:</span>
              <div style="font-size: 13px; font-weight: 400; color: #0f172a; padding: 4px 0;">
                ${diagnosis}
              </div>
            </div>
          `
              : ""
          }

          <div style="margin-bottom: 32px;">
            <h3 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #1e293b; margin-bottom: 12px;">
              Prescribed Medicines:
            </h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; color: #334155; font-weight: 700; text-transform: uppercase;">
                  <th style="padding: 10px; text-align: left;">#</th>
                  <th style="padding: 10px; text-align: left;">Medicine Name & Dosage</th>
                  <th style="padding: 10px; text-align: left;">Frequency</th>
                  <th style="padding: 10px; text-align: left;">Duration</th>
                  <th style="padding: 10px; text-align: left;">Meal Timing</th>
                  <th style="padding: 10px; text-align: left;">Instructions</th>
                  <th style="padding: 10px; text-align: center;">Qty</th>
                </tr>
              </thead>
              <tbody>
                ${medicinesListHtml}
              </tbody>
            </table>
          </div>

          ${
            notes
              ? `
            <div style="margin-bottom: 40px;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; display: block; margin-bottom: 4px;">Advice / General Notes:</span>
              <p style="font-size: 12px; color: #334155; font-style: italic; margin: 0;">${notes}</p>
            </div>
          `
              : ""
          }

          <div style="display: flex; justify-content: flex-end; margin-top: 60px;">
            <div style="text-align: center; border-top: 1px solid #94a3b8; padding-top: 8px; width: 200px;">
              <span style="font-size: 12px; font-weight: 700; color: #0f172a; display: block;">Dr. ${admin?.username || "John Doe"}</span>
              <span style="font-size: 10px; color: #64748b; display: block;">Doctor Signature / Stamp</span>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(filename);

      Toast({
        message: "Prescription PDF downloaded successfully!",
        type: "success",
      });
    } catch (err) {
      console.error("PDF Download Error:", err);
      Toast({ message: "Failed to download PDF file.", type: "error" });
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  if (!booking) return null;

  const patientFullName =
    `${booking.firstName || ""} ${booking.lastName || ""}`.trim() ||
    booking.name ||
    "Patient";

  return (
    <>
      <CustomModal
        isOpen={isOpen}
        onClose={onClose}
        title={`Write Prescription - ${patientFullName}`}
        maxWidth="max-w-[900px]"
      >
        {isLoading ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            Loading prescription data...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Diagnosis & Clinical Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Diagnosis / Medical Condition
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acute Viral Fever & Mild Dehydration"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Doctor Notes / Advice
                </label>
                <input
                  type="text"
                  placeholder="e.g. Drink plenty of water, rest for 3 days"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Prescribed Medicines Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-blue-600" /> Prescribed
                  Medicines (Rx)
                </h4>
                <Button
                  onClick={handleAddMedicineRow}
                  variant="outline"
                  size="sm"
                  startIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Medicine Line
                </Button>
              </div>

              <div className="space-y-3">
                {medicines.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col md:flex-row items-start md:items-center gap-3"
                  >
                    {/* 1. Medicine Name / Select */}
                    <div className="w-full md:w-56">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                        Medicine Name
                      </label>
                      {hasMedicineModule ? (
                        <div className="space-y-1">
                          <select
                            value={item.isCustom ? "custom" : item.medicineId}
                            onChange={(e) =>
                              handleMedicineSelectChange(idx, e.target.value)
                            }
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:border-blue-500 font-medium"
                          >
                            <option value="custom">
                              -- Custom Medicine --
                            </option>
                            {catalogMedicines.map((catMed) => (
                              <option key={catMed._id} value={catMed._id}>
                                {catMed.name}{" "}
                                {catMed.dosage ? `(${catMed.dosage})` : ""} -
                                Stock: {catMed.stock}
                              </option>
                            ))}
                          </select>

                          {item.isCustom && (
                            <input
                              type="text"
                              placeholder="Enter custom medicine name..."
                              value={item.name}
                              onChange={(e) =>
                                handleFieldChange(idx, "name", e.target.value)
                              }
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                            />
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          placeholder="Enter medicine name..."
                          value={item.name}
                          onChange={(e) =>
                            handleFieldChange(idx, "name", e.target.value)
                          }
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                        />
                      )}
                    </div>

                    {/* 2. Dosage */}
                    <div className="w-full md:w-28">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                        Dosage
                      </label>
                      <input
                        type="text"
                        placeholder="500mg"
                        value={item.dosage}
                        onChange={(e) =>
                          handleFieldChange(idx, "dosage", e.target.value)
                        }
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* 3. Frequency */}
                    <div className="w-full md:w-28">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                        Frequency
                      </label>
                      <select
                        value={item.frequency}
                        onChange={(e) =>
                          handleFieldChange(idx, "frequency", e.target.value)
                        }
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="1-0-1">1-0-1 (Morning & Night)</option>
                        <option value="1-1-1">1-1-1 (Thrice daily)</option>
                        <option value="1-0-0">1-0-0 (Morning only)</option>
                        <option value="0-0-1">0-0-1 (Night only)</option>
                        <option value="0-1-0">0-1-0 (Afternoon only)</option>
                        <option value="As Needed">As Needed (SOS)</option>
                      </select>
                    </div>

                    {/* 4. Duration */}
                    <div className="w-full md:w-24">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                        Duration
                      </label>
                      <input
                        type="text"
                        placeholder="5 Days"
                        value={item.duration}
                        onChange={(e) =>
                          handleFieldChange(idx, "duration", e.target.value)
                        }
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* 5. Instructions */}

                    {/* 6. Meal Timing */}
                    <div className="w-full md:w-32">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                        Meal Timing
                      </label>
                      <select
                        value={item.timing}
                        onChange={(e) =>
                          handleFieldChange(idx, "timing", e.target.value)
                        }
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="After Food">After Food</option>
                        <option value="Before Food">Before Food</option>
                        <option value="With Food">With Food</option>
                        <option value="Empty Stomach">Empty Stomach</option>
                        <option value="Anytime">Anytime</option>
                      </select>
                    </div>

                    <div className="w-full md:flex-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                        Instructions
                      </label>
                      <input
                        type="text"
                        placeholder="After meals with water"
                        value={item.instructions}
                        onChange={(e) =>
                          handleFieldChange(idx, "instructions", e.target.value)
                        }
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* 7. Quantity */}
                    <div className="w-full md:w-20">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleFieldChange(idx, "quantity", e.target.value)
                        }
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Remove button */}
                    <div className="md:pt-4">
                      {medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicineRow(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Remove Line"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  onClick={handleDownloadPDF}
                  variant="outline"
                  disabled={isDownloadingPDF}
                  startIcon={<Download className="w-4 h-4 text-emerald-600" />}
                  className="w-full sm:w-auto border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  {isDownloadingPDF ? "Generating PDF..." : "Download PDF"}
                </Button>

                <Button
                  type="button"
                  onClick={handlePrint}
                  variant="outline"
                  startIcon={<Printer className="w-4 h-4 text-gray-600" />}
                  className="w-full sm:w-auto"
                >
                  Print
                </Button>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <Button type="button" onClick={onClose} variant="outline">
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSavePrescription}
                  variant="primary"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save & Issue Prescription"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CustomModal>

      {/* Hidden Printable Medical Rx Layout */}
      <div
        id="printable-prescription-container"
        className="hidden print:block fixed inset-0 bg-white p-8 z-[99999] text-gray-900"
      >
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .printable-prescription,
            .printable-prescription * {
              visibility: visible;
            }
            .printable-prescription {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 20px;
            }
          }
        `}</style>

        <div className="printable-prescription font-sans text-sm">
          {/* Clinic & Doctor Header */}
          <div className="flex items-center justify-between pb-6 border-b-2 border-slate-900 mb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-wide">
                {admin?.businessName || "MEDICAL CLINIC"}
              </h1>
              <p className="text-xs text-slate-600 mt-1 font-semibold">
                Doctor: Dr. {admin?.username || "John Doe"}
              </p>
            </div>
          </div>

          {/* Patient Details Box */}
          <div className="mb-6 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-bold text-slate-700 block">
                PATIENT DETAILS:
              </span>
              <span className="text-base font-bold text-slate-900 block mt-1">
                {patientFullName}
              </span>
              <span className="text-slate-600 block">
                {booking.phoneNumber || "Phone: N/A"}
              </span>
              <span className="text-slate-600 block">
                {booking.email || "Email: N/A"}
              </span>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-700 block">
                PRESCRIPTION INFO:
              </span>
              <span className="text-slate-600 block mt-1">
                Booking ID: #{booking.bookingId || booking._id}
              </span>
              <span className="text-slate-600 block">
                Date: {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Diagnosis */}
          {diagnosis && (
            <div className="mb-6">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 block mb-1">
                Diagnosis / Medical Condition:
              </span>
              <p className="text-sm font-normal text-slate-900 py-1">
                {diagnosis}
              </p>
            </div>
          )}

          {/* Prescribed Medicines Table */}
          <div className="mb-8">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-3">
              Prescribed Medicines:
            </h3>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase">
                  <th className="p-2.5 text-left">#</th>
                  <th className="p-2.5 text-left">Medicine Name & Dosage</th>
                  <th className="p-2.5 text-left">Frequency</th>
                  <th className="p-2.5 text-left">Meal Timing</th>
                  <th className="p-2.5 text-left">Duration</th>
                  <th className="p-2.5 text-left">Instructions</th>
                  <th className="p-2.5 text-center">Qty</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((m, i) => (
                  <tr key={i} className="border-b border-slate-200">
                    <td className="p-2.5 font-semibold text-slate-600">
                      {i + 1}
                    </td>
                    <td className="p-2.5 font-bold text-slate-900">
                      {m.name} {m.dosage ? `(${m.dosage})` : ""}
                    </td>
                    <td className="p-2.5 text-slate-700 font-semibold">
                      {m.frequency}
                    </td>
                    <td className="p-2.5 text-slate-600">
                      {m.timing || "After Food"}
                    </td>
                    <td className="p-2.5 text-slate-700">{m.duration}</td>
                    <td className="p-2.5 text-slate-600">
                      {m.instructions || "--"}
                    </td>
                    <td className="p-2.5 text-center font-bold text-slate-900">
                      {m.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Advice / Doctor Notes */}
          {notes && (
            <div className="mb-12">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 block mb-1">
                Advice / General Notes:
              </span>
              <p className="text-xs text-slate-700 italic">{notes}</p>
            </div>
          )}

          {/* Doctor Signature */}
          <div className="flex justify-end pt-12">
            <div className="text-center border-t border-slate-400 pt-2 w-48">
              <span className="font-bold text-xs text-slate-900 block">
                Dr. {admin?.username || "John Doe"}
              </span>
              <span className="text-[10px] text-slate-500 block">
                Doctor Signature / Stamp
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
