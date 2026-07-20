"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import {
  MdEvent,
  MdSettings,
  MdAddCircle,
  MdTrendingUp,
  MdTrendingDown,
  MdPeople,
} from "react-icons/md";
import { HiUsers as HiUsersIcon } from "react-icons/hi";
import { FaRupeeSign } from "react-icons/fa";
import PageMeta from "@/components/PageMeta";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import Button from "@/components/UI/Button";
import { getDashboardStats } from "@/config/AxiosConfig";
import { adminUpdateStates } from "@/store/slices/authSlice";

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const adminState = useSelector((state) => state.admin) || {};
  const { admin } = adminState;

  const [stats, setStats] = useState({
    totalBookings: 0,
    activeStaff: 0,
    activeServices: 0,
    totalRevenue: 0,
    bookingsPercentage: 0,
    staffPercentage: 0,
    servicesPercentage: 0,
    revenuePercentage: 0,
  });

  useEffect(() => {
    const fetchDashboardStats = async () => {
      dispatch(adminUpdateStates({ loading: true }));
      try {
        const res = await getDashboardStats();
        if (res.status === 200 && res.data?.status === true) {
          const dashboardData = res.data.data[0];
          setStats({
            totalBookings: dashboardData.totalBookings?.current || 0,
            activeStaff: dashboardData.activeStaff?.current || 0,
            activeServices: dashboardData.activeServices?.current || 0,
            totalRevenue: dashboardData.totalRevenue?.current || 0,
            bookingsPercentage: dashboardData.totalBookings?.percentage_increase || 0,
            staffPercentage: dashboardData.activeStaff?.percentage_increase || 0,
            servicesPercentage: dashboardData.activeServices?.percentage_increase || 0,
            revenuePercentage: dashboardData.totalRevenue?.percentage_increase || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        dispatch(adminUpdateStates({ loading: false }));
      }
    };

    fetchDashboardStats();
  }, [dispatch]);

  const breadcrumbItems = [{ label: "Home", to: "/" }];

  const StatCard = ({ title, value, icon: Icon, color, trend, trendValue, onClick, route }) => {
    const cardColors = {
      blue: "bg-blue-50 border-blue-200",
      green: "bg-green-50 border-green-200",
      purple: "bg-purple-50 border-purple-200",
      orange: "bg-orange-50 border-orange-200",
      indigo: "bg-indigo-50 border-indigo-200",
      pink: "bg-pink-50 border-pink-200",
    };

    const iconColors = {
      blue: "text-blue-600 bg-blue-100",
      green: "text-green-600 bg-green-100",
      purple: "text-purple-600 bg-purple-100",
      orange: "text-orange-600 bg-orange-100",
      indigo: "text-indigo-600 bg-indigo-100",
      pink: "text-pink-600 bg-pink-100",
    };

    return (
      <div
        onClick={() => onClick && route && router.push(route)}
        className={`rounded-lg border-2 p-6 transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1 ${onClick ? "cursor-pointer" : ""
          } ${cardColors[color] || cardColors.blue}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-gray-800 mb-2">{value}</h3>
            {trend && trendValue && (
              <div className="flex items-center gap-1 text-sm">
                {trend === "up" ? (
                  <MdTrendingUp className="text-green-600" size={18} />
                ) : (
                  <MdTrendingDown className="text-red-600" size={18} />
                )}
                <span className={trend === "up" ? "text-green-600" : "text-red-600"}>
                  {trendValue}
                </span>
                <span className="text-gray-500">vs last month</span>
              </div>
            )}
          </div>
          <div className={`p-4 rounded-xl ${iconColors[color] || iconColors.blue}`}>
            <Icon size={32} />
          </div>
        </div>
      </div>
    );
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

  return (
    <>
      <PageMeta title="Dashboard - Appointment Booking" description="Dashboard overview" />
      <PageBreadcrumb items={breadcrumbItems} />

      <div className="pb-20">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Welcome to Appointment Booking
          </h1>
          <p className="text-gray-600">
            Here's an overview of your booking activities and schedule
          </p>
        </div>

        <div className="flex flex-col">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6 order-1 sm:order-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Button
                variant="primary"
                size="md"
                onClick={() => router.push("/appointments")}
                className="w-full justify-start gap-2"
                startIcon={<MdAddCircle size={20} />}
              >
                Add Booking
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => router.push("/staff")}
                className="w-full justify-start gap-2"
                startIcon={<HiUsersIcon size={20} />}
              >
                Add Staff Member
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => router.push("/services")}
                className="w-full justify-start gap-2"
                startIcon={<MdSettings size={20} />}
              >
                Manage Services
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => router.push("/customers")}
                className="w-full justify-start gap-2"
                startIcon={<MdPeople size={20} />}
              >
                View Customers
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 order-2 sm:order-1">
            <StatCard
              title="Total Bookings"
              value={formatNumber(stats.totalBookings)}
              icon={MdEvent}
              color="blue"
              trend={stats.bookingsPercentage >= 0 ? "up" : "down"}
              trendValue={`${Math.abs(stats.bookingsPercentage).toFixed(0)}%`}
              onClick={true}
              route="/appointments"
            />
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats.totalRevenue)}
              icon={FaRupeeSign}
              color="purple"
              trend={stats.revenuePercentage >= 0 ? "up" : "down"}
              trendValue={`${Math.abs(stats.revenuePercentage).toFixed(0)}%`}
              onClick={true}
              route="/appointments"
            />
            <StatCard
              title="Active Staff"
              value={stats.activeStaff}
              icon={HiUsersIcon}
              color="green"
              onClick={true}
              route="/staff"
            />
            <StatCard
              title="Active Services"
              value={stats.activeServices}
              icon={MdSettings}
              color="orange"
              onClick={true}
              route="/services"
            />
          </div>
        </div>
      </div>
    </>
  );
}
