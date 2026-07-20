"use client";

import React from "react";
import PageMeta from "@/components/PageMeta";
import PageBreadcrumb from "@/components/PageBreadcrumb";

export default function Dashboard() {


  return (
    <>
      <PageMeta title="Dashboard - Appointment Booking" description="Dashboard overview" />
      <PageBreadcrumb items={[{ label: "Dashboard", to: "/" }]} />

      <div className="pb-20">
        <div>dashboard</div>
      </div>
    </>
  );
}
