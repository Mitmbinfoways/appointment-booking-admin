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
    icon: Calendar,
    name: "Appointments",
    subItems: [
      {
        name: "Bookings List",
        path: "/appointments",
      },
    ],
  },
  {
    icon: Settings,
    name: "Settings",
    subItems: [
      {
        name: "Slots Settings",
        path: "/settings/slots",
      },
      {
        name: "Form Settings",
        path: "/settings/form",
      },
      {
        name: "Holidays List",
        path: "/settings/holidays",
      }
    ],
  },
];

export const getMenuItemsByUserType = (role) => {
  if (role === "SuperAdmin") {
    return superAdminMenuItems;
  }
  return adminMenuItems; // Default to Admin
};
