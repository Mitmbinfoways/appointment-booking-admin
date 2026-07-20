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
        icon: LayoutDashboard,
        name: "Holidays Management",
        path: "/holidays",
    },
    // {
    //     icon: Calendar,
    //     name: "Appointments",
    //     isActive: ["/appointments", "/appointments/add"],
    //     subItems: [
    //         {
    //             name: "Bookings List",
    //             path: "/appointments",
    //         },
    //         {
    //             name: "Add Booking",
    //             path: "/appointments/add",
    //         },
    //     ],
    // },
];

export const getMenuItemsByUserType = (role) => {
  if (role === "SuperAdmin") {
    return superAdminMenuItems;
  }
    return adminMenuItems; // Default to Admin
};
