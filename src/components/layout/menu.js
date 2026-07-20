import { LayoutDashboard, Calendar, Users, Settings } from "lucide-react";

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
  // {
  //   icon: Users,
  //   name: "Management",
  //   subItems: [
  //     {
  //       name: "Staff Members",
  //       path: "/staff",
  //     },
  //     {
  //       name: "Services Catalog",
  //       path: "/services",
  //     },
  //     {
  //       name: "Customers Directory",
  //       path: "/customers",
  //     },
  //   ],
  // },
  // {
  //   icon: Settings,
  //   name: "Settings",
  //   subItems: [
  //     {
  //       name: "My Profile",
  //       path: "/profile",
  //     },
  //   ],
  // },
];

export const getMenuItemsByUserType = (userType) => {
  return adminMenuItems;
};
