"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import PageMeta from "@/components/PageMeta";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import Button from "@/components/UI/Button";
import { Table, THead, TBody, TR, TD, TH } from "@/components/UI/table";
import { Toast } from "@/components/Toast";
import { format, parseISO } from "date-fns";
import {
  getLinkedAdminsApi,
  createAdminLinkApi,
  removeAdminLinkApi,
  toggleAdminLinkStatusApi,
} from "@/config/AxiosConfig";
import {
  Link2,
  Copy,
  Check,
  UserCheck,
  Trash2,
  Plus,
  ShieldCheck,
  Stethoscope,
  Building2,
} from "lucide-react";

export default function AdminLinksPage() {
  const adminState = useSelector((state) => state.admin) || {};
  const admin = adminState.admin;
  const adminId = admin?._id;
  const isSuperAdmin = admin?.role === "SuperAdmin";

  const [linkedAdmins, setLinkedAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fromJoinIdInput, setFromJoinIdInput] = useState("");
  const [toJoinIdInput, setToJoinIdInput] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const fetchLinkedAdmins = useCallback(async () => {
    const targetId = adminId || "all";
    setIsLoading(true);
    try {
      const res = await getLinkedAdminsApi(targetId);
      if (res.status === 200 && res.data?.data) {
        setLinkedAdmins(res.data.data);
      } else {
        Toast({
          message: res.data?.message || "Failed to fetch linked admins",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error fetching linked admins:", err);
      Toast({ message: "Failed to connect to server.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    fetchLinkedAdmins();
  }, [fetchLinkedAdmins]);

  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    Toast({ message: `${label} copied to clipboard!`, type: "success" });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    if (isSuperAdmin) {
      if (!fromJoinIdInput.trim() || !toJoinIdInput.trim()) {
        Toast({ message: "Please enter both Join IDs.", type: "error" });
        return;
      }
    } else {
      if (!toJoinIdInput.trim()) {
        Toast({ message: "Please enter a Join ID.", type: "error" });
        return;
      }
    }

    setIsLinking(true);
    try {
      const payload = isSuperAdmin
        ? {
            fromJoinId: fromJoinIdInput.trim(),
            toJoinId: toJoinIdInput.trim(),
          }
        : {
            fromAdminId: adminId,
            toJoinId: toJoinIdInput.trim(),
          };

      const res = await createAdminLinkApi(payload);

      if (res.status === 201 && res.data?.statusCode === 201) {
        Toast({
          message: "Admin accounts linked successfully!",
          type: "success",
        });
        setFromJoinIdInput("");
        setToJoinIdInput("");
        fetchLinkedAdmins();
      } else {
        Toast({
          message: res.data?.message || "Failed to link admins.",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error linking admins:", err);
      const errMsg = err?.response?.data?.message || "Failed to link admins.";
      Toast({ message: errMsg, type: "error" });
    } finally {
      setIsLinking(false);
    }
  };

  const handleToggleStatus = async (linkId) => {
    try {
      const res = await toggleAdminLinkStatusApi(linkId);
      if (res.status === 200 && res.data?.statusCode === 200) {
        Toast({
          message: res.data.message || "Link status updated.",
          type: "success",
        });
        fetchLinkedAdmins();
      } else {
        Toast({
          message: res.data?.message || "Failed to update link status.",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error toggling link status:", err);
      Toast({ message: "Failed to update link status.", type: "error" });
    }
  };

  const handleRemoveLink = async (linkId, linkedAdminName) => {
    if (
      !window.confirm(
        `Are you sure you want to disconnect from ${linkedAdminName}?`,
      )
    ) {
      return;
    }

    try {
      const res = await removeAdminLinkApi(linkId);
      if (res.status === 200 && res.data?.statusCode === 200) {
        Toast({
          message: `Disconnected from ${linkedAdminName} successfully.`,
          type: "success",
        });
        fetchLinkedAdmins();
      } else {
        Toast({
          message: res.data?.message || "Failed to remove link.",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error removing link:", err);
      Toast({ message: "Failed to remove link.", type: "error" });
    }
  };

  return (
    <div>
      <PageMeta
        title="Admin Links | Appointment Booking Management"
        description="Connect Doctor & Medical Admin Accounts using Join IDs"
      />
      <PageBreadcrumb pageTitle="Admin Links" />

      {/* Header Info & Join ID Display */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 mb-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link2 className="h-6 w-6 text-blue-200" />
              <h2 className="text-xl font-bold">Admin Module Linker</h2>
            </div>
            <p className="text-blue-100 text-sm max-w-xl">
              Connect Doctor accounts with Medical/Pharmacy accounts. Connected
              Medical admins will automatically receive prescriptions sent by
              this Doctor.
            </p>
          </div>
        </div>
      </div>

      {/* Connect Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Plus size={18} className="text-blue-600" /> Connect Admin Accounts
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          {isSuperAdmin
            ? "Enter the Join IDs of the Doctor Admin and Medical Admin you want to link together."
            : "Enter the unique Join ID (e.g. JN-A1B2C3) of the Doctor or Medical admin you want to link with."}
        </p>

        <form
          onSubmit={handleLinkSubmit}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-2xl"
        >
          {isSuperAdmin ? (
            <>
              <div className="flex-1">
                <input
                  type="text"
                  value={fromJoinIdInput}
                  onChange={(e) => setFromJoinIdInput(e.target.value.toUpperCase())}
                  placeholder="Doctor Join ID (e.g. JN-X9K2M7)"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-mono uppercase focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={toJoinIdInput}
                  onChange={(e) => setToJoinIdInput(e.target.value.toUpperCase())}
                  placeholder="Medical Join ID (e.g. JN-P3R8T5)"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-mono uppercase focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </>
          ) : (
            <div className="flex-1">
              <input
                type="text"
                value={toJoinIdInput}
                onChange={(e) => setToJoinIdInput(e.target.value.toUpperCase())}
                placeholder="e.g. JN-X9K2M7"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-mono uppercase focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isLinking}
            className="flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Link2 size={16} />
            {isLinking ? "Connecting..." : "Connect Accounts"}
          </Button>
        </form>
      </div>

      {/* Linked Admins Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <UserCheck size={18} className="text-green-600" /> Connected Admin Accounts
            </h3>
            <p className="text-xs text-gray-500">
              List of all active module connections with other Admins.
            </p>
          </div>
          <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-full border border-blue-200">
            {linkedAdmins.length} Connected
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <THead>
              {isSuperAdmin ? (
                <TR>
                  <TH>Sr No</TH>
                  <TH>Source Admin (Doctor)</TH>
                  <TH>Doctor Join ID</TH>
                  <TH>Target Admin (Medical)</TH>
                  <TH>Medical Join ID</TH>
                  <TH>Connected Date</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              ) : (
                <TR>
                  <TH>Sr No</TH>
                  <TH>Linked Admin Name</TH>
                  <TH>Email / Phone</TH>
                  <TH>Business Name</TH>
                  <TH>Join ID</TH>
                  <TH>Module Type</TH>
                  <TH>Connected Date</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              )}
            </THead>
            <TBody>
              {isLoading ? (
                <TR>
                  <TD
                    colSpan={isSuperAdmin ? 8 : 9}
                    className="px-6 py-10 text-center text-gray-400 text-sm"
                  >
                    Loading connections...
                  </TD>
                </TR>
              ) : linkedAdmins.length === 0 ? (
                <TR>
                  <TD
                    colSpan={isSuperAdmin ? 8 : 9}
                    className="px-6 py-10 text-center text-gray-400 text-sm"
                  >
                    <div className="flex flex-col items-center justify-center gap-2 py-4">
                      <Link2 className="h-10 w-10 text-gray-300" />
                      <p className="font-medium text-gray-500">No Connected Admins Found</p>
                      <p className="text-xs text-gray-400 max-w-sm text-center">
                        Enter Join IDs above to connect Doctor and Medical module users together.
                      </p>
                    </div>
                  </TD>
                </TR>
              ) : (
                linkedAdmins.map((item, index) => {
                  if (isSuperAdmin) {
                    const fromA = item.fromAdmin || {};
                    const toA = item.toAdmin || {};
                    return (
                      <TR key={item._id}>
                        <TD className="text-sm text-gray-500">{index + 1}</TD>
                        <TD className="text-sm font-semibold text-gray-900">
                          <div>{fromA.username || "--"}</div>
                          <div className="text-xs text-gray-400 font-normal">
                            {fromA.businessName || fromA.email || ""}
                          </div>
                        </TD>
                        <TD className="text-sm font-mono text-xs text-purple-600">
                          <span className="bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            {fromA.joinId || "--"}
                          </span>
                        </TD>
                        <TD className="text-sm font-semibold text-gray-900">
                          <div>{toA.username || "--"}</div>
                          <div className="text-xs text-gray-400 font-normal">
                            {toA.businessName || toA.email || ""}
                          </div>
                        </TD>
                        <TD className="text-sm font-mono text-xs text-green-600">
                          <span className="bg-green-50 px-2 py-0.5 rounded border border-green-200">
                            {toA.joinId || "--"}
                          </span>
                        </TD>
                        <TD className="text-sm text-gray-500">
                          {item.linkedAt
                            ? format(parseISO(item.linkedAt), "MMM dd, yyyy")
                            : "--"}
                        </TD>
                        <TD className="text-sm">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item._id)}
                            className={`cursor-pointer inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              item.status === "active"
                                ? "bg-green-100 text-green-800 border border-green-300"
                                : "bg-red-100 text-red-800 border border-red-300"
                            }`}
                          >
                            {item.status === "active" ? "Active" : "Inactive"}
                          </button>
                        </TD>
                        <TD className="text-sm text-right">
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveLink(
                                item._id,
                                `${fromA.username || "Admin"} & ${toA.username || "Admin"}`,
                              )
                            }
                            className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                            title="Disconnect Link"
                          >
                            <Trash2 size={16} />
                          </button>
                        </TD>
                      </TR>
                    );
                  }

                  const target = item.linkedAdmin || {};
                  return (
                    <TR key={item._id}>
                      <TD className="text-sm text-gray-500">{index + 1}</TD>
                      <TD className="text-sm font-semibold text-gray-900">
                        {target.username || "--"}
                      </TD>
                      <TD className="text-sm text-gray-600">
                        <div>{target.email}</div>
                        {target.phoneNumber && (
                          <div className="text-xs text-gray-400">{target.phoneNumber}</div>
                        )}
                      </TD>
                      <TD className="text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={14} className="text-gray-400" />
                          <span>{target.businessName || "--"}</span>
                        </div>
                      </TD>
                      <TD className="text-sm font-mono text-xs text-blue-600">
                        <span className="bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {target.joinId || "--"}
                        </span>
                      </TD>
                      <TD className="text-sm">
                        {item.linkedModule === "doctor" ? (
                          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-purple-200">
                            <Stethoscope size={13} /> Doctor
                          </span>
                        ) : item.linkedModule === "medical" ? (
                          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200">
                            <ShieldCheck size={13} /> Medical / Pharmacy
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                            {item.linkedModule || "general"}
                          </span>
                        )}
                      </TD>
                      <TD className="text-sm text-gray-500">
                        {item.linkedAt
                          ? format(parseISO(item.linkedAt), "MMM dd, yyyy")
                          : "--"}
                      </TD>
                      <TD className="text-sm">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item._id)}
                          className={`cursor-pointer inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            item.status === "active"
                              ? "bg-green-100 text-green-800 border border-green-300"
                              : "bg-red-100 text-red-800 border border-red-300"
                          }`}
                        >
                          {item.status === "active" ? "Active" : "Inactive"}
                        </button>
                      </TD>
                      <TD className="text-sm text-right">
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveLink(item._id, target.username || "Admin")
                          }
                          className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                          title="Disconnect Account"
                        >
                          <Trash2 size={16} />
                        </button>
                      </TD>
                    </TR>
                  );
                })
              )}
            </TBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
