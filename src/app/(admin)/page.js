"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import PageMeta from "@/components/PageMeta";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import Button from "@/components/UI/Button";
import { Table, THead, TBody, TR, TD, TH } from "@/components/UI/table";
import { CustomModal } from "@/components/UI/Modal";
import {
  getDashboardStats,
  getBookings,
  getAdminsList,
  getAdminFormConfig,
  getUserModulesApi,
} from "@/config/AxiosConfig";
import { adminUpdateStates } from "@/store/slices/authSlice";
import {
  Calendar,
  IndianRupee,
  Users,
  Briefcase,
  PlusCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Eye,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sparkles,
  CalendarDays,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Building,
  Crown,
  Settings,
  Stethoscope,
  Pill,
} from "lucide-react";

/**
 * Reusable StatCard Component Function
 * - Uses rounded-lg for card container and icon box
 * - Soft Pastel Backgrounds with matching Soft Border
 * - Bold Title & Number
 * - Bottom Trend Indicator (Red / Green Arrow)
 * - Right-aligned soft pastel icon container
 */
const StatCard = ({ title, value, icon: Icon, color, onClick, loading }) => {
  if (loading) {
    return (
      <div className="rounded-lg border-2 border-gray-200 bg-white p-5 animate-pulse shadow-xs">
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-2 space-y-2">
            <div className="h-3.5 bg-gray-200 rounded w-24"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="w-12 h-12 rounded-lg bg-gray-200 shrink-0"></div>
        </div>
      </div>
    );
  }

  const themeStyles = {
    blue: {
      cardBg: "bg-[#edf5ff] border-[#bfdbfe]",
      iconBg: "bg-[#3b82f6] text-white shadow-xs",
    },
    orange: {
      cardBg: "bg-[#fff7ed] border-[#fed7aa]",
      iconBg: "bg-[#ea580c] text-white shadow-xs",
    },
    purple: {
      cardBg: "bg-[#faf5ff] border-[#e9d5ff]",
      iconBg: "bg-[#9333ea] text-white shadow-xs",
    },
    green: {
      cardBg: "bg-[#f0fdf4] border-[#bbf7d0]",
      iconBg: "bg-[#16a34a] text-white shadow-xs",
    },
  };

  const currentTheme = themeStyles[color] || themeStyles.blue;

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border-2 p-5 transition-all duration-300 ease-in-out hover:shadow-md hover:-translate-y-0.5 ${
        currentTheme.cardBg
      } ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 pr-2">
          <p className="text-sm font-semibold text-gray-700 mb-1">{title}</p>
          <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {value}
          </h3>
        </div>

        <div
          className={`p-3.5 rounded-lg flex items-center justify-center shrink-0 ${currentTheme.iconBg}`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const adminState = useSelector((state) => state.admin) || {};
  const { admin } = adminState;

  // Strict User Role Detection: SuperAdmin vs Admin
  const isSuperAdmin = admin?.role === "SuperAdmin";

  // Admin Dashboard State
  const [stats, setStats] = useState({
    totalBookings: 0,
    weekBookings: 0,
    todayBookings: 0,
    pendingBookings: 0,
    bookingsPercentage: 0,
    weekPercentage: 0,
    todayPercentage: 0,
    pendingPercentage: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [statusCounts, setStatusCounts] = useState({
    confirmed: 0,
    pending: 0,
    cancelled: 0,
    total: 0,
  });

  // SuperAdmin Dashboard State
  const [superAdminStats, setSuperAdminStats] = useState({
    totalAdmins: 0,
    activeAdmins: 0,
    inactiveAdmins: 0,
  });
  const [adminsList, setAdminsList] = useState([]);

  // Common UI State
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [formFields, setFormFields] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [userModules, setUserModules] = useState({ medicineModule: false, medicalModule: false });

  // Fetch Dashboard Data strictly based on logged-in role
  const fetchDashboardData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const payload = { type: isSuperAdmin ? "SuperAdmin" : "Admin" };
      const resStats = await getDashboardStats(payload);

      if (resStats.status === 200 && resStats.data?.data) {
        const statsData = resStats.data.data;
        if (isSuperAdmin && statsData.type === "SuperAdmin") {
          setSuperAdminStats((prev) => ({
            ...prev,
            totalAdmins: statsData.totalAdmins ?? prev.totalAdmins,
            activeAdmins: statsData.activeAdmins ?? prev.activeAdmins,
            inactiveAdmins: statsData.inactiveAdmins ?? prev.inactiveAdmins,
          }));
        } else if (!isSuperAdmin && statsData.type === "Admin") {
          setStats((prev) => ({
            ...prev,
            totalBookings: statsData.totalBookings ?? prev.totalBookings,
            weekBookings: statsData.weekBookings ?? prev.weekBookings,
            todayBookings: statsData.todayBookings ?? prev.todayBookings,
            pendingBookings: statsData.pendingBookings ?? prev.pendingBookings,
          }));
        }
      }

      if (isSuperAdmin) {
        // Fetch SuperAdmin Admins List
        try {
          const resAdmins = await getAdminsList();
          if (resAdmins.status === 200 && resAdmins.data?.statusCode === 200) {
            const list = resAdmins.data.data || [];
            setAdminsList(list);
            const activeCount = list.filter((a) => a.isActive !== false).length;
            const inactiveCount = list.filter(
              (a) => a.isActive === false,
            ).length;
            setSuperAdminStats((prev) => ({
              ...prev,
              totalAdmins: list.length,
              activeAdmins: activeCount,
              inactiveAdmins: inactiveCount,
            }));
          }
        } catch (err) {
          console.error("SuperAdmin admins list fetch error:", err);
        }
      } else {
        // Fetch Regular Admin Recent Bookings, Form Config, and User Modules
        try {
          if (admin?._id) {
            getUserModulesApi(admin._id)
              .then((res) => {
                if (res.status === 200 && res.data?.data) {
                  setUserModules(res.data.data);
                }
              })
              .catch(() => {});
          }

          const [resBookings, resForm] = await Promise.all([
            getBookings(),
            getAdminFormConfig().catch(() => null),
          ]);

          if (resForm?.status === 200 && resForm.data?.statusCode === 200) {
            setFormFields(resForm.data.data?.fields || []);
          }

          if (
            resBookings?.status === 200 &&
            resBookings.data?.statusCode === 200
          ) {
            const allBookings = resBookings.data.data?.bookings || [];
            setRecentBookings(allBookings.slice(0, 6));

            const counts = {
              confirmed: 0,
              pending: 0,
              cancelled: 0,
              total: allBookings.length,
            };
            const todayStr = new Date().toISOString().split("T")[0];
            const now = new Date();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);

            let todayCount = 0;
            let weekCount = 0;

            allBookings.forEach((b) => {
              const st = (b.status || "").toLowerCase();
              if (st === "confirmed") counts.confirmed++;
              else if (st === "pending") counts.pending++;
              else if (st === "cancelled") counts.cancelled++;

              const bDateStr = b.slotDate ? b.slotDate.split("T")[0] : "";
              if (bDateStr === todayStr) {
                todayCount++;
              }
              if (b.slotDate) {
                const d = new Date(b.slotDate);
                if (!isNaN(d.getTime()) && d >= startOfWeek && d <= now) {
                  weekCount++;
                }
              }
            });
            setStatusCounts(counts);

            setStats((prev) => ({
              ...prev,
              totalBookings: allBookings.length || prev.totalBookings,
              weekBookings: weekCount || prev.weekBookings,
              todayBookings: todayCount || prev.todayBookings,
              pendingBookings: counts.pending || prev.pendingBookings,
            }));
          }
        } catch (err) {
          console.error("Bookings fetch error:", err);
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    dispatch(adminUpdateStates({ loading: true }));
    fetchDashboardData().finally(() => {
      dispatch(adminUpdateStates({ loading: false }));
    });
  }, [dispatch, fetchDashboardData]);

  // Display first 3-4 main detail fields
  const displayFields = useMemo(() => {
    const regular = formFields.filter((f) => {
      const type = f.type || f.inputType;
      return type !== "image" && type !== "video";
    });

    if (regular.length > 0) {
      return regular.slice(0, 4);
    }

    return [
      { fieldKey: "firstName", label: "First Name" },
      { fieldKey: "lastName", label: "Last Name" },
      { fieldKey: "email", label: "Email" },
      { fieldKey: "phoneNumber", label: "Phone Number" },
    ];
  }, [formFields]);

  const getFieldValue = (b, field) => {
    if (!b || !field) return "-";
    const key = field.fieldKey;

    const dynVal =
      b.dynamicResponses?.[key] ||
      (typeof b.dynamicResponses?.get === "function"
        ? b.dynamicResponses.get(key)
        : null);

    if (dynVal !== undefined && dynVal !== null && dynVal !== "") {
      return String(dynVal);
    }

    if (key === "firstName") return b.firstName || b.name || "-";
    if (key === "lastName") return b.lastName || "-";
    if (key === "email") return b.email || "-";
    if (key === "phoneNumber" || key === "phone")
      return b.phoneNumber || b.phone || "-";

    if (b[key] !== undefined && b[key] !== null && b[key] !== "") {
      return String(b[key]);
    }

    return "-";
  };
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat("en-IN").format(num);
  };

  const getNumericBookingId = (b) => {
    if (!b) return "";
    if (b.bookingId) return String(b.bookingId);
    const dateDigits = b.slotDate ? b.slotDate.replace(/-/g, "") : "";
    let suffix = "0000";
    if (b._id) {
      const hexPart = b._id.toString().slice(-6);
      const num = parseInt(hexPart, 16);
      if (!isNaN(num)) {
        suffix = String(num % 10000).padStart(4, "0");
      }
    }
    return dateDigits ? `${dateDigits}${suffix}` : suffix;
  };

  const formatDateDDMMYYYY = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (!isNaN(d.getTime()) && dateStr.includes("T")) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
    const parts = dateStr.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <>
      <PageMeta
        title={`${isSuperAdmin ? "SuperAdmin" : "Admin"} Dashboard - Appointment Booking`}
        description="Dashboard Overview"
      />
      <PageBreadcrumb
        items={[
          { label: "Home", to: "/" },
          { label: "Dashboard", to: "/" },
        ]}
      />

      <div className="pb-16 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-lg border border-gray-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              {isSuperAdmin ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-500" /> SuperAdmin
                  Panel
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Admin
                  Panel
                </span>
              )}
              <span className="text-xs text-gray-500">
                Overview of your business activities
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mt-1">
              {isSuperAdmin
                ? "SuperAdmin Dashboard"
                : `Welcome back, ${admin?.name || "Admin"} 👋`}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              disabled={isRefreshing}
              title="Refresh Data"
              className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors shadow-2xs cursor-pointer flex items-center gap-2 text-xs font-semibold"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* SUPERADMIN DASHBOARD VIEW (Shown ONLY when logged in as SuperAdmin) */}
        {/* ------------------------------------------------------------- */}
        {isSuperAdmin ? (
          <div className="space-y-6">
            {/* SuperAdmin Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <StatCard
                title="Total Admin"
                value={formatNumber(superAdminStats.totalAdmins)}
                icon={Users}
                color="blue"
                loading={isLoading}
                onClick={() => router.push("/admins")}
              />
              <StatCard
                title="Active Admin"
                value={formatNumber(superAdminStats.activeAdmins)}
                icon={UserCheck}
                color="green"
                loading={isLoading}
                onClick={() => router.push("/admins?status=active")}
              />
              <StatCard
                title="Inactive Admin"
                value={formatNumber(superAdminStats.inactiveAdmins || 0)}
                icon={AlertCircle}
                color="orange"
                loading={isLoading}
                onClick={() => router.push("/admins?status=inactive")}
              />
            </div>

            {/* SuperAdmin Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200/80 p-6 shadow-xs">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                SuperAdmin Quick Controls
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => router.push("/admins?action=create")}
                  className="flex items-center justify-between p-4 rounded-lg border border-blue-100 bg-blue-50/40 hover:bg-blue-600 hover:text-white group transition-all duration-200 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-blue-600 text-white group-hover:bg-white group-hover:text-blue-600 transition-colors">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-white">
                        Create New Admin
                      </h4>
                      <p className="text-xs text-gray-500 group-hover:text-blue-100">
                        Add tenant account
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
                </button>

                <button
                  onClick={() => router.push("/admins")}
                  className="flex items-center justify-between p-4 rounded-lg border border-purple-100 bg-purple-50/40 hover:bg-purple-600 hover:text-white group transition-all duration-200 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-purple-600 text-white group-hover:bg-white group-hover:text-purple-600 transition-colors">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-white">
                        Manage Admins
                      </h4>
                      <p className="text-xs text-gray-500 group-hover:text-purple-100">
                        Toggle & Edit status
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
                </button>
              </div>
            </div>

            {/* Admins Overview Directory Table */}
            <div className="bg-white rounded-lg border border-gray-200/80 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-gray-200/80 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Registered Admins Directory
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Overview of active admin accounts
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => router.push("/admins")}
                  className="gap-1"
                >
                  <span>Go to Admins List</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <TR>
                      <TH>SR NO</TH>
                      <TH>Admin / Business</TH>
                      <TH>Email Address</TH>
                      <TH>Phone</TH>
                      <TH>Status</TH>
                      <TH className="text-right">Actions</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {isLoading ? (
                      <TR>
                        <TD
                          colSpan={6}
                          className="py-8 text-center text-gray-400 text-xs"
                        >
                          Loading admins list...
                        </TD>
                      </TR>
                    ) : adminsList.length === 0 ? (
                      <TR>
                        <TD
                          colSpan={6}
                          className="py-8 text-center text-gray-400 text-xs"
                        >
                          No admin accounts found.
                        </TD>
                      </TR>
                    ) : (
                      adminsList.map((adm, idx) => (
                        <TR key={adm._id || idx}>
                          <TD className="text-xs text-gray-500 font-medium">
                            {idx + 1}
                          </TD>
                          <TD className="text-xs font-bold text-gray-900">
                            {adm.name || adm.userName || "Admin Account"}
                          </TD>
                          <TD className="text-xs text-gray-600">
                            {adm.email || "-"}
                          </TD>
                          <TD className="text-xs text-gray-600">
                            {adm.mobileNumber || adm.phone || "-"}
                          </TD>
                          <TD>
                            <span
                              className={`inline-flex px-2.5 py-0.5 text-[11px] font-semibold border rounded-full ${
                                adm.isActive !== false
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              {adm.isActive !== false ? "Active" : "Inactive"}
                            </span>
                          </TD>
                          <TD className="text-right">
                            <button
                              onClick={() => router.push(`/admins`)}
                              className="px-3 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            >
                              Manage
                            </button>
                          </TD>
                        </TR>
                      ))
                    )}
                  </TBody>
                </Table>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Admin Stat Cards Grid */}
            {!userModules.medicalModule && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatCard
                  title="Total Bookings"
                  value={formatNumber(stats.totalBookings)}
                  icon={Calendar}
                  color="blue"
                  loading={isLoading}
                  onClick={() => router.push("/appointments-list")}
                />
                <StatCard
                  title="Week Bookings"
                  value={formatNumber(stats.weekBookings || 0)}
                  icon={CalendarDays}
                  color="purple"
                  loading={isLoading}
                  onClick={() => router.push("/appointments-list?filter=week")}
                />
                <StatCard
                  title="Today Bookings"
                  value={formatNumber(stats.todayBookings || 0)}
                  icon={Clock}
                  color="green"
                  loading={isLoading}
                  onClick={() => router.push("/appointments-list?filter=today")}
                />
                <StatCard
                  title="Pending Bookings"
                  value={formatNumber(
                    stats.pendingBookings || statusCounts.pending || 0,
                  )}
                  icon={AlertCircle}
                  color="orange"
                  loading={isLoading}
                  onClick={() => router.push("/appointments-list?status=pending")}
                />
              </div>
            )}

            {/* Admin Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200/80 p-6 shadow-xs">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {userModules.medicalModule ? (
                  <>
                    <button
                      onClick={() => router.push("/medical")}
                      className="flex items-center justify-between p-4 rounded-lg border border-purple-100 bg-purple-50/40 hover:bg-purple-600 hover:text-white group transition-all duration-200 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-purple-600 text-white group-hover:bg-white group-hover:text-purple-600 transition-colors">
                          <Stethoscope className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 group-hover:text-white">
                            Medical Prescriptions
                          </h4>
                          <p className="text-xs text-gray-500 group-hover:text-purple-100">
                            View & fulfill prescriptions
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
                    </button>
                    {userModules.medicineModule && (
                      <button
                        onClick={() => router.push("/medicines")}
                        className="flex items-center justify-between p-4 rounded-lg border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-600 hover:text-white group transition-all duration-200 text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-lg bg-emerald-600 text-white group-hover:bg-white group-hover:text-emerald-600 transition-colors">
                            <Pill className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900 group-hover:text-white">
                              Medicine Inventory
                            </h4>
                            <p className="text-xs text-gray-500 group-hover:text-emerald-100">
                              Manage medicines & stock
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() =>
                        router.push("/appointments-list/create-appointment")
                      }
                      className="flex items-center justify-between p-4 rounded-lg border border-indigo-100 bg-indigo-50/40 hover:bg-indigo-600 hover:text-white group transition-all duration-200 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-indigo-600 text-white group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                          <PlusCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 group-hover:text-white">
                            Create Booking
                          </h4>
                          <p className="text-xs text-gray-500 group-hover:text-indigo-100">
                            Schedule new appointment
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
                    </button>

                    <button
                      onClick={() => router.push("/appointments-list")}
                      className="flex items-center justify-between p-4 rounded-lg border border-blue-100 bg-blue-50/40 hover:bg-blue-600 hover:text-white group transition-all duration-200 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-blue-600 text-white group-hover:bg-white group-hover:text-blue-600 transition-colors">
                          <CalendarDays className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 group-hover:text-white">
                            All Appointments
                          </h4>
                          <p className="text-xs text-gray-500 group-hover:text-blue-100">
                            View & edit list
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
                    </button>

                    <button
                      onClick={() => router.push("/holidays")}
                      className="flex items-center justify-between p-4 rounded-lg border border-purple-100 bg-purple-50/40 hover:bg-purple-600 hover:text-white group transition-all duration-200 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-purple-600 text-white group-hover:bg-white group-hover:text-purple-600 transition-colors">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 group-hover:text-white">
                            Holidays Calendar
                          </h4>
                          <p className="text-xs text-gray-500 group-hover:text-purple-100">
                            Set breaks & off days
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
                    </button>

                    <button
                      onClick={() => router.push("/settings/slots")}
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50/40 hover:bg-slate-800 hover:text-white group transition-all duration-200 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-slate-800 text-white group-hover:bg-white group-hover:text-slate-800 transition-colors">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 group-hover:text-white">
                            Slot Settings
                          </h4>
                          <p className="text-xs text-gray-500 group-hover:text-slate-200">
                            Configure time slots
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Main Content Grid: Recent Appointments & Status Breakdown */}
            {!userModules.medicalModule && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Recent Appointments Table */}
              <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200/80 shadow-xs overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-200/80 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Recent Appointments
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Latest bookings received
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/appointments-list")}
                    className="gap-1 text-xs"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="overflow-x-auto flex-1">
                  <Table>
                    <THead>
                      <TR>
                        <TH>SR NO</TH>
                        <TH>Booking ID</TH>
                        {displayFields.map((field) => (
                          <TH key={field.fieldKey || field.label}>
                            {field.label}
                          </TH>
                        ))}
                        <TH>Appointment Date & Time</TH>
                        <TH>Status</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {isLoading ? (
                        <TR>
                          <TD
                            colSpan={4 + displayFields.length}
                            className="py-8 text-center text-gray-400 text-xs"
                          >
                            Loading recent bookings...
                          </TD>
                        </TR>
                      ) : recentBookings.length === 0 ? (
                        <TR>
                          <TD
                            colSpan={4 + displayFields.length}
                            className="py-8 text-center text-gray-400 text-xs"
                          >
                            No appointments found.
                          </TD>
                        </TR>
                      ) : (
                        recentBookings.map((b, idx) => (
                          <TR key={b._id || idx}>
                            <TD className="text-xs text-gray-500 font-medium">
                              {idx + 1}
                            </TD>
                            <TD className="text-xs font-bold text-indigo-600 font-mono">
                              #{getNumericBookingId(b)}
                            </TD>

                            {/* Render main 3-4 detail fields */}
                            {displayFields.map((field) => (
                              <TD
                                key={field.fieldKey || field.label}
                                className="text-xs text-gray-700 font-medium"
                              >
                                {getFieldValue(b, field)}
                              </TD>
                            ))}

                            <TD className="text-xs">
                              <span className="block font-semibold text-gray-900">
                                {formatDateDDMMYYYY(b.slotDate)}
                              </span>
                              <span className="block text-[11px] text-gray-500">
                                {b.slotStartTime} - {b.slotEndTime}
                              </span>
                            </TD>
                            <TD>
                              <span
                                className={`inline-flex px-2.5 py-0.5 text-[11px] font-semibold border rounded-full ${getStatusClass(
                                  b.status,
                                )}`}
                              >
                                {b.status || "Pending"}
                              </span>
                            </TD>
                          </TR>
                        ))
                      )}
                    </TBody>
                  </Table>
                </div>
              </div>

              {/* Right Column: Status Analytics */}
              <div className="space-y-6">
                {/* Booking Status Distribution */}
                <div className="bg-white rounded-lg border border-gray-200/80 p-6 shadow-xs">
                  <h3 className="text-base font-bold text-gray-900 mb-1">
                    Status Breakdown
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Appointments status overview
                  </p>

                  <div className="space-y-4">
                    {/* Confirmed Bar */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1.5">
                        <span className="flex items-center gap-1.5 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          Confirmed
                        </span>
                        <span className="text-gray-900 font-bold">
                          {statusCounts.confirmed}{" "}
                          <span className="text-gray-400 font-normal">
                            (
                            {statusCounts.total > 0
                              ? Math.round(
                                  (statusCounts.confirmed /
                                    statusCounts.total) *
                                    100,
                                )
                              : 0}
                            %)
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${statusCounts.total > 0 ? (statusCounts.confirmed / statusCounts.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Pending Bar */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1.5">
                        <span className="flex items-center gap-1.5 text-amber-700">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                          Pending
                        </span>
                        <span className="text-gray-900 font-bold">
                          {statusCounts.pending}{" "}
                          <span className="text-gray-400 font-normal">
                            (
                            {statusCounts.total > 0
                              ? Math.round(
                                  (statusCounts.pending / statusCounts.total) *
                                    100,
                                )
                              : 0}
                            %)
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${statusCounts.total > 0 ? (statusCounts.pending / statusCounts.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Cancelled Bar */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1.5">
                        <span className="flex items-center gap-1.5 text-rose-700">
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          Cancelled
                        </span>
                        <span className="text-gray-900 font-bold">
                          {statusCounts.cancelled}{" "}
                          <span className="text-gray-400 font-normal">
                            (
                            {statusCounts.total > 0
                              ? Math.round(
                                  (statusCounts.cancelled /
                                    statusCounts.total) *
                                    100,
                                )
                              : 0}
                            %)
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${statusCounts.total > 0 ? (statusCounts.cancelled / statusCounts.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>

      {/* Quick View Details Modal */}
      <CustomModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Appointment Quick View"
        maxWidth="max-w-[600px]"
      >
        {selectedBooking && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  Booking ID
                </span>
                <div className="text-base font-bold text-indigo-700 font-mono">
                  #{getNumericBookingId(selectedBooking)}
                </div>
              </div>
              <span
                className={`inline-flex px-3 py-1 text-xs font-bold border rounded-full ${getStatusClass(
                  selectedBooking.status,
                )}`}
              >
                {selectedBooking.status || "Pending"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <span className="block text-[10px] text-gray-400 uppercase font-semibold">
                  Appointment Date
                </span>
                <span className="font-bold text-gray-900">
                  {formatDateDDMMYYYY(selectedBooking.slotDate)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <span className="block text-[10px] text-gray-400 uppercase font-semibold">
                  Slot Time
                </span>
                <span className="font-bold text-gray-900">
                  {selectedBooking.slotStartTime} -{" "}
                  {selectedBooking.slotEndTime}
                </span>
              </div>
            </div>

            {selectedBooking.dynamicResponses && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Submitted Form Details
                </h4>
                <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-200 space-y-2">
                  {Object.entries(selectedBooking.dynamicResponses).map(
                    ([key, val]) => (
                      <div
                        key={key}
                        className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs border-b border-gray-200/60 pb-1.5 last:border-b-0 last:pb-0"
                      >
                        <span className="font-semibold text-gray-600 capitalize">
                          {key.replace(/_/g, " ")}:
                        </span>
                        <span className="font-bold text-gray-900">
                          {String(val || "-")}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-gray-200">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </CustomModal>
    </>
  );
}
