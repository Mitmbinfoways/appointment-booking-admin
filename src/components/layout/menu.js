import { LayoutDashboard, Calendar, Users, Settings } from "lucide-react";

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
    icon: Settings,
    name: "Form Configuration",
    path: "/settings/form",
  },
  {
    icon: Settings,
    name: "Slots Settings",
    path: "/settings/slots",
  },
  {
    icon: Calendar,
    name: "Holidays Management",
    path: "/holidays",
  },
  {
    icon: Calendar,
    name: "Appointments List",
    path: "/appointments",
  },
];

export const getMenuItemsByUserType = (role) => {
  if (role === "SuperAdmin") {
    return superAdminMenuItems;
  }
    return adminMenuItems; // Default to Admin
};
