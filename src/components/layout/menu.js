import { LayoutDashboard, Calendar, Users, ClipboardList, Clock, CalendarCheck } from "lucide-react";

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
  }
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
    path: "/appointments",
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
];

export const getMenuItemsByUserType = (role) => {
  if (role === "SuperAdmin") {
    return superAdminMenuItems;
  }
    return adminMenuItems; // Default to Admin
};
