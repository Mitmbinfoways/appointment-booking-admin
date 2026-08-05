"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import PageMeta from "@/components/PageMeta";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import Button from "@/components/UI/Button";
import { CustomModal } from "@/components/UI/Modal";
import { Table, THead, TBody, TR, TD, TH } from "@/components/UI/table";
import { Toast } from "@/components/Toast";
import { format } from "date-fns";
import {
  getMedicalPrescriptionsApi,
  updatePrescriptionFulfillmentStatusApi,
  getUserModulesApi,
} from "@/config/AxiosConfig";
import {
  Stethoscope,
  CheckCircle2,
  Clock,
  PackageCheck,
  AlertTriangle,
  Mail,
  Phone,
  Eye,
  Pill,
} from "lucide-react";

export default function MedicalPrescriptionsPage() {
  const adminState = useSelector((state) => state.admin) || {};
  const admin = adminState.admin;
  const adminId = admin?._id;

  const [hasAccess, setHasAccess] = useState(true);
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchPrescriptions = useCallback(async () => {
    if (!adminId) return;
    setIsLoading(true);
    try {
      // 1. Check module access
      const moduleRes = await getUserModulesApi(adminId);
      if (moduleRes.status === 200 && moduleRes.data?.data) {
        if (!moduleRes.data.data.medicalModule) {
          setHasAccess(false);
          setIsLoading(false);
          return;
        }
      }

      // 2. Fetch prescriptions
      const res = await getMedicalPrescriptionsApi({ adminId });
      if (res.status === 200 && res.data?.data) {
        setPrescriptions(res.data.data);
        setHasAccess(true);
      } else {
        Toast({
          message: res.data?.message || "Failed to load prescriptions",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error fetching medical prescriptions:", err);
      if (err?.response?.status === 403) {
        setHasAccess(false);
      } else {
        Toast({ message: "Failed to connect to server.", type: "error" });
      }
    } finally {
      setIsLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  // Helper to extract patient detail from prescription or booking dynamicResponses
  const getValFromPrescription = (pres, keys, defaultVal = "") => {
    if (!pres) return defaultVal;
    const b = pres.bookingId || {};
    const dyn = b.dynamicResponses || {};

    // Direct match on prescription or booking
    for (const k of keys) {
      if (pres[k]) return pres[k];
      if (b[k]) return b[k];
    }

    // Direct key in dynamicResponses
    for (const k of keys) {
      if (typeof dyn.get === "function" && dyn.get(k)) return dyn.get(k);
      if (dyn[k]) return dyn[k];
    }

    // Dynamic scan by key substring
    const entries =
      typeof dyn.entries === "function"
        ? Array.from(dyn.entries())
        : Object.entries(dyn);
    for (const [k, v] of entries) {
      if (!v) continue;
      const lowerK = String(k).toLowerCase();
      for (const targetKey of keys) {
        if (lowerK.includes(targetKey.toLowerCase())) {
          return String(v);
        }
      }
    }

    return defaultVal;
  };

  const getPatientFullDetails = (pres) => {
    const fName = getValFromPrescription(pres, [
      "firstName",
      "first_name",
      "fname",
      "first",
    ]);
    const lName = getValFromPrescription(pres, [
      "lastName",
      "last_name",
      "lname",
      "last",
    ]);
    const fullName =
      `${fName} ${lName}`.trim() ||
      getValFromPrescription(
        pres,
        ["patientName", "name", "full_name", "patient_name"],
        pres?.patientName || "Patient",
      );
    const email = getValFromPrescription(
      pres,
      ["patientEmail", "email", "email_address", "userEmail"],
      pres?.patientEmail || "",
    );
    const phone = getValFromPrescription(
      pres,
      ["patientPhone", "phoneNumber", "phone", "mobile", "contact"],
      pres?.patientPhone || "",
    );

    return { patientName: fullName, patientEmail: email, patientPhone: phone };
  };

  const filteredPrescriptions = prescriptions.filter((pres) => {
    const { patientName, patientEmail, patientPhone } =
      getPatientFullDetails(pres);
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      (patientName && patientName.toLowerCase().includes(searchLower)) ||
      (patientEmail && patientEmail.toLowerCase().includes(searchLower)) ||
      (patientPhone && patientPhone.includes(searchQuery)) ||
      (pres.doctorName &&
        pres.doctorName.toLowerCase().includes(searchLower)) ||
      (pres.diagnosis && pres.diagnosis.toLowerCase().includes(searchLower));

    const matchesStatus =
      statusFilter === "All" || pres.fulfillmentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (prescriptionId, newStatus) => {
    setIsUpdatingStatus(true);
    try {
      const res = await updatePrescriptionFulfillmentStatusApi(
        prescriptionId,
        newStatus,
      );
      if (res.status === 200) {
        Toast({
          message: `Fulfillment status updated to '${newStatus}'!`,
          type: "success",
        });
        setPrescriptions((prev) =>
          prev.map((p) =>
            p._id === prescriptionId
              ? { ...p, fulfillmentStatus: newStatus }
              : p,
          ),
        );
        if (
          selectedPrescription &&
          selectedPrescription._id === prescriptionId
        ) {
          setSelectedPrescription((prev) => ({
            ...prev,
            fulfillmentStatus: newStatus,
          }));
        }
      } else {
        Toast({
          message: res.data?.message || "Failed to update status",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error updating prescription status:", err);
      Toast({ message: "Failed to update status.", type: "error" });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const openViewModal = (pres) => {
    setSelectedPrescription(pres);
    setIsViewModalOpen(true);
  };

  // Metric counts
  const totalCount = prescriptions.length;
  const sentCount = prescriptions.filter(
    (p) => p.fulfillmentStatus === "sent",
  ).length;
  const dispensedCount = prescriptions.filter(
    (p) => p.fulfillmentStatus === "dispensed",
  ).length;
  const completedCount = prescriptions.filter(
    (p) => p.fulfillmentStatus === "completed",
  ).length;

  const renderViewModal = () => {
    if (!selectedPrescription) return null;

    const {
      patientName: modalPatientName,
      patientEmail: modalPatientEmail,
      patientPhone: modalPatientPhone,
    } = getPatientFullDetails(selectedPrescription);

    return (
      <CustomModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Medical Prescription - ${modalPatientName}`}
        size="lg"
      >
        <div className="space-y-6">
          {/* Header info */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase block">
                Patient Information
              </span>
              <span className="text-sm font-bold text-gray-900 block mt-1">
                {modalPatientName}
              </span>
              {modalPatientEmail && (
                <span className="text-xs text-gray-600 block">
                  {modalPatientEmail}
                </span>
              )}
              {modalPatientPhone && (
                <span className="text-xs text-gray-600 block">
                  {modalPatientPhone}
                </span>
              )}
            </div>

            <div>
              <span className="text-xs font-bold text-gray-500 uppercase block">
                Prescribing Doctor
              </span>
              <span className="text-sm font-bold text-gray-900 block mt-1">
                Dr. {selectedPrescription.doctorName}
              </span>
              <span className="text-xs text-gray-600 block">
                {selectedPrescription.businessName}
              </span>
            </div>
          </div>

          {/* Diagnosis & Notes */}
          {(selectedPrescription.diagnosis || selectedPrescription.notes) && (
            <div className="space-y-2">
              {selectedPrescription.diagnosis && (
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase block">
                    Diagnosis
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedPrescription.diagnosis}
                  </span>
                </div>
              )}
              {selectedPrescription.notes && (
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase block">
                    Doctor Advice / Notes
                  </span>
                  <span className="text-sm italic text-gray-700">
                    {selectedPrescription.notes}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Prescribed Medicines Table */}
          <div>
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-purple-600" /> Prescribed Medicines
              List
            </h4>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 font-bold text-gray-700 uppercase">
                    <th className="p-3">#</th>
                    <th className="p-3">Medicine & Dosage</th>
                    <th className="p-3">Frequency</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Meal Timing</th>
                    <th className="p-3">Instructions</th>
                    <th className="p-3 text-center">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedPrescription.medicines?.map((m, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-3 font-semibold text-gray-500">
                        {idx + 1}
                      </td>
                      <td className="p-3 font-bold text-gray-900">
                        {m.name} {m.dosage ? `(${m.dosage})` : ""}
                      </td>
                      <td className="p-3 font-semibold text-gray-700">
                        {m.frequency}
                      </td>
                      <td className="p-3 text-gray-700">{m.duration}</td>
                      <td className="p-3 text-gray-700">
                        {m.timing || "After Food"}
                      </td>
                      <td className="p-3 text-gray-600">
                        {m.instructions || "--"}
                      </td>
                      <td className="p-3 text-center font-bold text-gray-900">
                        {m.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Status Update Actions */}
          <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-purple-900 uppercase block">
                Fulfillment Status
              </span>
              <span className="text-xs text-purple-700">
                Update status as medicines are prepared and handed over
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() =>
                  handleUpdateStatus(selectedPrescription._id, "dispensed")
                }
                variant="outline"
                size="sm"
                disabled={
                  isUpdatingStatus ||
                  selectedPrescription.fulfillmentStatus === "dispensed"
                }
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                Mark as Dispensed
              </Button>
              <Button
                onClick={() =>
                  handleUpdateStatus(selectedPrescription._id, "completed")
                }
                variant="primary"
                size="sm"
                disabled={
                  isUpdatingStatus ||
                  selectedPrescription.fulfillmentStatus === "completed"
                }
                className="bg-green-600 hover:bg-green-700 border-green-600 text-white"
              >
                Mark as Completed
              </Button>
            </div>
          </div>

          {/* Footer Close */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button onClick={() => setIsViewModalOpen(false)} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </CustomModal>
    );
  };

  if (!hasAccess) {
    return (
      <div className="p-6 space-y-6">
        <PageMeta
          title="Medical Prescriptions"
          description="View and fulfill patient prescriptions"
        />
        <PageBreadcrumb
          items={[
            { label: "Home", to: "/" },
            { label: "Medical Prescriptions" },
          ]}
        />

        <div className="mt-8 bg-white rounded-lg p-12 border border-gray-200 text-center max-w-xl mx-auto shadow-theme-xs">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Medical Module Disabled
          </h2>
          <p className="text-sm text-gray-500">
            The Medical Module is currently not enabled for your account. Please
            contact your SuperAdmin to enable access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageMeta
        title="Medical Prescriptions"
        description="View and fulfill patient prescriptions"
      />
      <PageBreadcrumb
        items={[{ label: "Home", to: "/" }, { label: "Medical Prescriptions" }]}
      />

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-theme-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Total Prescriptions
            </span>
            <span className="text-2xl font-bold text-gray-900 mt-1 block">
              {totalCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Stethoscope className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-theme-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Pending Fulfillment
            </span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block">
              {sentCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-theme-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Dispensed
            </span>
            <span className="text-2xl font-bold text-blue-600 mt-1 block">
              {dispensedCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Pill className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-theme-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Completed
            </span>
            <span className="text-2xl font-bold text-green-600 mt-1 block">
              {completedCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-theme-xs">
        {/* Search & Filter Header */}
        <div className="flex flex-col gap-4 p-4 border-b border-gray-200 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search patient, doctor, diagnosis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500 w-full sm:w-72"
            />

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide shrink-0">
                STATUS:
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500 text-gray-700 bg-white cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="sent">Pending (Sent)</option>
                <option value="dispensed">Dispensed</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Prescriptions Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <THead>
              <TR>
                <TH>#</TH>
                <TH>PATIENT DETAILS</TH>
                <TH>DOCTOR & CLINIC</TH>
                <TH>ASSIGNED TO</TH>
                <TH>DIAGNOSIS & MEDICINES</TH>
                <TH>DATE SENT</TH>
                <TH>FULFILLMENT STATUS</TH>
                <TH className="text-right">ACTIONS</TH>
              </TR>
            </THead>
            <TBody>
              {isLoading ? (
                <TR>
                  <TD
                    colSpan={8}
                    className="py-10 text-center text-gray-400 text-sm"
                  >
                    Loading medical prescriptions...
                  </TD>
                </TR>
              ) : filteredPrescriptions.length === 0 ? (
                <TR>
                  <TD
                    colSpan={8}
                    className="py-10 text-center text-gray-400 text-sm"
                  >
                    No medical prescriptions found.
                  </TD>
                </TR>
              ) : (
                filteredPrescriptions.map((pres, idx) => {
                  const { patientName, patientEmail, patientPhone } =
                    getPatientFullDetails(pres);
                  const sentUser = pres.sentToMedicalUser;

                  return (
                    <TR key={pres._id}>
                      <TD className="text-sm text-gray-500">{idx + 1}</TD>

                      {/* Patient Details */}
                      <TD>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">
                            {patientName}
                          </span>
                          {patientEmail && (
                            <span className="text-xs text-gray-500 inline-flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-gray-400" />
                              {patientEmail}
                            </span>
                          )}
                          {patientPhone && (
                            <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gray-400" />
                              {patientPhone}
                            </span>
                          )}
                        </div>
                      </TD>

                      {/* Doctor & Clinic */}
                      <TD>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-800">
                            Dr. {pres.doctorName || "Doctor"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {pres.businessName || "--"}
                          </span>
                        </div>
                      </TD>

                      {/* Assigned Medical User */}
                      <TD>
                        {sentUser ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-purple-900">
                              {sentUser.name}
                            </span>
                            <span className="text-[11px] text-purple-600 font-semibold">
                              {sentUser.role || "Medical Staff"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-italic">
                            Unassigned
                          </span>
                        )}
                      </TD>

                      {/* Diagnosis & Medicines Summary */}
                      <TD>
                        <div className="flex flex-col max-w-xs">
                          {pres.diagnosis && (
                            <span className="text-xs font-semibold text-gray-900 truncate">
                              {pres.diagnosis}
                            </span>
                          )}
                          <span className="text-xs text-gray-500 inline-flex items-center gap-1 mt-0.5">
                            <Pill className="w-3.5 h-3.5 text-purple-500" />
                            {pres.medicines?.length || 0} Medicines Prescribed
                          </span>
                        </div>
                      </TD>

                      {/* Date Sent */}
                      <TD className="text-sm text-gray-500">
                        {pres.sentAt || pres.updatedAt
                          ? format(
                              new Date(pres.sentAt || pres.updatedAt),
                              "dd-MM-yyyy",
                            )
                          : "--"}
                      </TD>

                      {/* Status */}
                      <TD>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                            pres.fulfillmentStatus === "completed"
                              ? "bg-green-100 text-green-700"
                              : pres.fulfillmentStatus === "dispensed"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {pres.fulfillmentStatus === "completed" ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                            </>
                          ) : pres.fulfillmentStatus === "dispensed" ? (
                            <>
                              <PackageCheck className="w-3.5 h-3.5" /> Dispensed
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5" /> Pending
                            </>
                          )}
                        </span>
                      </TD>

                      {/* Actions */}
                      <TD className="text-right">
                        <Button
                          onClick={() => openViewModal(pres)}
                          variant="outline"
                          size="sm"
                          startIcon={
                            <Eye className="w-3.5 h-3.5 text-purple-600" />
                          }
                          className="border-purple-200 text-purple-700 hover:bg-purple-50"
                        >
                          View & Fulfill
                        </Button>
                      </TD>
                    </TR>
                  );
                })
              )}
            </TBody>
          </Table>
        </div>
      </div>

      {/* Prescription View & Fulfillment Modal */}
      {renderViewModal()}
    </div>
  );
}
