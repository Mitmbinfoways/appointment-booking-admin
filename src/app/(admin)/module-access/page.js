"use client";

import React, { useState, useEffect } from "react";
import PageMeta from "@/components/PageMeta";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Table, THead, TBody, TR, TD, TH } from "@/components/UI/table";
import { Toast } from "@/components/Toast";
import {
  getAdminsList,
  getUserModulesApi,
  toggleUserModuleApi,
} from "@/config/AxiosConfig";
import {
  Package,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Mail,
  Building2,
} from "lucide-react";

export default function ModuleAccessPage() {
  const [adminsList, setAdminsList] = useState([]);
  const [adminModules, setAdminModules] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminsList();
      if (res.status === 200 && res.data?.statusCode === 200) {
        const list = res.data.data;
        setAdminsList(list);

        // Fetch modules for each admin
        const moduleMap = {};
        await Promise.all(
          list.map(async (adm) => {
            try {
              const modRes = await getUserModulesApi(adm._id);
              if (modRes.status === 200 && modRes.data?.data) {
                moduleMap[adm._id] = modRes.data.data;
              }
            } catch (e) {
              // ignore single fetch error
            }
          })
        );
        setAdminModules(moduleMap);
      } else {
        Toast({ message: res.data?.message || "Failed to fetch admins", type: "error" });
      }
    } catch (err) {
      console.error("Error fetching admin modules:", err);
      Toast({ message: "Failed to connect to server.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleModule = async (adminId, moduleName, currentEnabled) => {
    try {
      const res = await toggleUserModuleApi({
        adminId,
        moduleName,
        enabled: !currentEnabled,
      });
      if (res.status === 200) {
        const friendlyName =
          moduleName === "medicineModule" ? "Medicine Module" : moduleName;

        Toast({
          message: `${friendlyName} ${!currentEnabled ? "enabled" : "disabled"} successfully!`,
          type: "success",
        });

        setAdminModules((prev) => ({
          ...prev,
          [adminId]: {
            ...prev[adminId],
            [moduleName]: !currentEnabled,
          },
        }));
      } else {
        Toast({ message: res.data?.message || "Failed to toggle module", type: "error" });
      }
    } catch (err) {
      console.error("Error toggling module:", err);
      Toast({ message: "Failed to toggle module.", type: "error" });
    }
  };

  const filteredAdmins = adminsList.filter(
    (adm) =>
      adm.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adm.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (adm.businessName && adm.businessName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalAdmins = adminsList.length;
  const medicineModuleCount = Object.values(adminModules).filter((m) => m?.medicineModule).length;

  return (
    <div className="p-6 space-y-6">
      <PageMeta title="Module Access Management" description="Manage tenant admin module permissions" />
      <PageBreadcrumb items={[{ label: "Home", to: "/" }, { label: "Module Access Management" }]} />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-theme-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Total Tenant Admins
            </span>
            <span className="text-2xl font-bold text-gray-900 mt-1 block">{totalAdmins}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-theme-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Medicine Module Active
            </span>
            <span className="text-2xl font-bold text-green-600 mt-1 block">{medicineModuleCount}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Card (Matches Project Theme layout) */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-theme-xs">
        {/* Header Section */}
        <div className="flex flex-col gap-4 p-4 border-b border-gray-200 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search by Admin username, business name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-full sm:w-80"
            />
          </div>
        </div>

        {/* Module Access Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <THead>
              <TR>
                <TH>#</TH>
                <TH>ADMIN PROFILE</TH>
                <TH>BUSINESS NAME</TH>
                <TH>MEDICINE MODULE ACCESS</TH>
              </TR>
            </THead>
            <TBody>
              {isLoading ? (
                <TR>
                  <TD colSpan={4} className="py-10 text-center text-gray-400 text-sm">
                    Loading admin module permissions...
                  </TD>
                </TR>
              ) : filteredAdmins.length === 0 ? (
                <TR>
                  <TD colSpan={4} className="py-10 text-center text-gray-400 text-sm">
                    No Admin accounts found matching search.
                  </TD>
                </TR>
              ) : (
                filteredAdmins.map((adm, idx) => {
                  const hasMed = Boolean(adminModules[adm._id]?.medicineModule);

                  return (
                    <TR key={adm._id}>
                      <TD className="text-sm text-gray-500">{idx + 1}</TD>

                      {/* Admin Profile Cell */}
                      <TD>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">{adm.username}</span>
                          <span className="text-xs text-gray-500 inline-flex items-center gap-1 mt-0.5">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            {adm.email}
                          </span>
                        </div>
                      </TD>

                      {/* Business Name */}
                      <TD>
                        <span className="text-sm text-gray-700 inline-flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          {adm.businessName || "--"}
                        </span>
                      </TD>

                      {/* Medicine Module Control */}
                      <TD>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleModule(adm._id, "medicineModule", hasMed)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              hasMed ? "bg-blue-600" : "bg-gray-200"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                hasMed ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                          <span
                            className={`text-xs font-bold inline-flex items-center gap-1 ${
                              hasMed ? "text-blue-600" : "text-gray-400"
                            }`}
                          >
                            {hasMed ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Enabled
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" />
                                Disabled
                              </>
                            )}
                          </span>
                        </div>
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
