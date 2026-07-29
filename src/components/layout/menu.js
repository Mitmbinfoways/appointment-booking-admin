import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardList,
  Clock,
  CalendarCheck,
  Pill,
  UserCheck,
  Layers,
} from "lucide-react";

export const superAdminMenuItems = [
  {
    icon: LayoutDashboard,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: Users,
    name: "Admins Management",
    path: "/admins",
    isActive: [
      "/admins",
      "/admins/", // prefix matches all sub-routes like `/admins/[id]/holidays` and `/admins/appointments-list/[id]`
    ],
  },
  {
    icon: Layers,
    name: "Module Access",
    path: "/module-access",
  },
];

export const adminMenuItems = [
  {
    icon: LayoutDashboard,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: CalendarCheck,
    name: "Appointments List",
    path: "/appointments-list",
    isActive: [
      "/appointments-list",
      "/appointments-list/", // prefix matches sub-routes like `/appointments-list/create-appointment` and `/appointments-list/edit-appointment/[bookingId]`
    ],
  },
  {
    icon: ClipboardList,
    name: "Form Configuration",
    path: "/settings/form",
  },
  {
    icon: Clock,
    name: "Slots Settings",
    path: "/settings/slots",
  },
  {
    icon: Calendar,
    name: "Holidays Management",
    path: "/holidays",
  },
  {
    icon: Pill,
    name: "Medicine Inventory",
    path: "/medicines",
    isModule: "medicineModule",
  },
  {
    icon: UserCheck,
    name: "User Management",
    path: "/users",
    isModule: "userManagementModule",
  },
];

export const getMenuItemsByUserType = (role) => {
  if (role === "SuperAdmin") {
    return superAdminMenuItems;
  }
  return adminMenuItems; // Default to Admin
};
