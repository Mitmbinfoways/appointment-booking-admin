"use client";

import React, {
  useMemo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { getMenuItemsByUserType } from "@/components/layout/menu";
import { ChevronDownIcon, HorizontalDotsIcon } from "@/Icons";
import { useSelector } from "react-redux";
import { getUserModulesApi } from "@/config/AxiosConfig";

const AppSidebar = () => {
  const subMenuRefs = useRef({});
  const pathname = usePathname();

  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [subMenuHeight, setSubMenuHeight] = useState({});

  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    setIsHovered,
    toggleMobileSidebar,
  } = useSidebar();
  const adminState = useSelector((state) => state.admin) || {};
  const admin = adminState.admin;
  const [userModules, setUserModules] = useState({ medicineModule: false });

  useEffect(() => {
    const fetchModules = async () => {
      if (admin?._id && admin?.role !== "SuperAdmin") {
        try {
          const res = await getUserModulesApi(admin._id);
          if (res.status === 200 && res.data?.data) {
            setUserModules(res.data.data);
          }
        } catch (err) {
          console.error("Error loading user modules:", err);
        }
      }
    };
    fetchModules();
  }, [admin?._id, admin?.role]);

  const navItems = useMemo(() => {
    const userRole = admin?.role || admin?.type || "Admin";
    const items = getMenuItemsByUserType(userRole);
    if (userRole === "SuperAdmin") return items;
    return items.filter((item) => {
      if (userModules?.medicalModule && item.hideInMedicalModule) {
        return false;
      }
      if (!item.isModule) return true;
      return userModules[item.isModule] === true;
    });
  }, [admin, userModules]);

  const isActive = useCallback(
    (item) => {
      if (!item) return false;
      if (typeof item === "string") {
        return pathname === item;
      }
      if (Array.isArray(item.isActive)) {
        return item.isActive.some((p) => {
          if (p.endsWith("/")) {
            return pathname.startsWith(p);
          }
          return pathname === p;
        });
      }
      return pathname === item.path;
    },
    [pathname],
  );

  useEffect(() => {
    let submenuMatched = false;
    navItems.forEach((nav, index) => {
      if (nav.subItems) {
        if (isActive(nav)) {
          setOpenSubmenu({ index });
          submenuMatched = true;
        } else {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem)) {
              setOpenSubmenu({ index });
              submenuMatched = true;
            }
          });
        }
      }
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive, navItems]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu, isExpanded, isHovered, isMobileOpen, navItems]);

  const handleSubmenuToggle = (index) => {
    setOpenSubmenu((prev) => {
      if (prev && prev.index === index) {
        return null;
      }
      return { index };
    });
  };

  const renderIcon = (IconComponent) => {
    if (!IconComponent) return null;
    return <IconComponent className="size-5" />;
  };

  const renderMenuItems = (items) => {
    if (!items || items.length === 0) return null;

    return (
      <ul className="flex flex-col gap-0.5 w-full list-none p-0 m-0">
        {items.map((nav, index) => {
          const IconComponent = nav.icon;
          return (
            <li key={nav.name} className="list-none">
              {nav.subItems ? (
                <button
                  onClick={() => handleSubmenuToggle(index)}
                  className={`menu-item group focus:outline-none ${
                    openSubmenu && openSubmenu.index === index
                      ? "menu-item-active"
                      : "menu-item-inactive"
                  } cursor-pointer ${
                    !isExpanded && !isHovered
                      ? "md:justify-center"
                      : "md:justify-start"
                  }`}
                >
                  <span
                    className={`menu-item-icon-size ${
                      openSubmenu && openSubmenu.index === index
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    {renderIcon(IconComponent)}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text text-md">{nav.name}</span>
                  )}
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <ChevronDownIcon
                      className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                        openSubmenu && openSubmenu.index === index
                          ? "rotate-180 text-brand-500"
                          : ""
                      }`}
                    />
                  )}
                </button>
              ) : (
                nav.path && (
                  <Link
                    href={nav.path}
                    onClick={() => {
                      if (isMobileOpen) {
                        toggleMobileSidebar();
                      }
                    }}
                    className={`menu-item group ${
                      isActive(nav) ? "menu-item-active" : "menu-item-inactive"
                    } ${
                      !isExpanded && !isHovered
                        ? "md:justify-center"
                        : "md:justify-start"
                    }`}
                  >
                    <span
                      className={`menu-item-icon-size ${
                        isActive(nav)
                          ? "menu-item-icon-active"
                          : "menu-item-icon-inactive"
                      }`}
                    >
                      {renderIcon(IconComponent)}
                    </span>
                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text text-md">{nav.name}</span>
                    )}
                  </Link>
                )
              )}
              {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
                <div
                  ref={(el) => {
                    subMenuRefs.current[`${index}`] = el;
                  }}
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    height:
                      openSubmenu && openSubmenu.index === index
                        ? `${subMenuHeight[`${index}`]}px`
                        : "0px",
                  }}
                >
                  <ul className="mt-2 space-y-1 ml-9 list-none p-0 m-0">
                    {nav.subItems.map((subItem) => (
                      <li key={subItem.name} className="list-none">
                        <Link
                          href={subItem.path}
                          onClick={() => {
                            if (isMobileOpen) {
                              toggleMobileSidebar();
                            }
                          }}
                          className={`menu-dropdown-item text-md ${
                            isActive(subItem)
                              ? "menu-dropdown-item-active"
                              : "menu-dropdown-item-inactive"
                          }`}
                        >
                          {subItem.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <aside
      className={`fixed flex flex-col md:mt-0 top-0 px-3 md:px-4 lg:px-5 left-0 bg-white text-gray-900 h-screen transition-all duration-300 ease-in-out border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
              ? "w-[290px]"
              : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        z-[1000] md:z-50 lg:z-50
        ${
          isExpanded
            ? "md:translate-x-0 lg:translate-x-0"
            : "md:-translate-x-full lg:translate-x-0"
        }`}
      onMouseEnter={() =>
        !isExpanded && window.innerWidth >= 1024 && setIsHovered(true)
      }
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-3 md:py-6 flex items-center gap-2 ${
          !isExpanded && !isHovered ? "md:justify-center" : "justify-start"
        }`}
      >
        <Link
          href="/"
          className="h-12 aspect-square flex items-center gap-2 transition-all duration-300 ease-in-out"
        >
          {isExpanded || isHovered || isMobileOpen ? (
            <Image
              src="/user-avtar.png"
              alt="Logo"
              width={40}
              height={40}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <Image
              src="/user-avtar.png"
              alt="Logo"
              width={32}
              height={32}
              className="w-8 h-8 rounded-full mt-2.5"
            />
          )}
        </Link>
        {isExpanded || isHovered || isMobileOpen ? (
          <span className="font-bold text-xl flex items-center text-gray-800">
            Booking Admin
          </span>
        ) : null}
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-0.5">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-5 text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "md:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? null : (
                  <HorizontalDotsIcon className="size-6" />
                )}
              </h2>
              {renderMenuItems(navItems)}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
