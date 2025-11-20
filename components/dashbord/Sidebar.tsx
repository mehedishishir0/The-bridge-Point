


"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Settings,
  LogOut,
  LayoutDashboard,
  FileText,
  Home,
  Award,
  CreditCard,
  Users,
  ContactRound,
  BrickWallShield,
  Tag,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useAddPrice, useGetPrice } from "@/hooks/ApiClling";

const allNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Tenant Applications Management", href: "/tenant-applications", icon: FileText },
  { name: "Extermination Applications", href: "/extermination-applications", icon: Award },
  { name: "Apartment Listings Management", href: "/apartment-listings", icon: Home },
  { name: "Contactors", href: "/contactors", icon: ContactRound },
  { name: "Services", href: "/services", icon: BrickWallShield },
  { name: "Bookings", href: "/bookings", icon: BrickWallShield },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "News Letter", href: "/newsletter", icon: Users },
  { name: "Admin Request", href: "/admin-request", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  isMobileMenuOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isMobileMenuOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [accessRoutes, setAccessRoutes] = useState<string[]>([]);
  const { data: session } = useSession();
  const token = session?.accessToken as string | undefined;
  const userRole = session?.user?.role as string | undefined;

  const getPrice = useGetPrice(token);
  const updatePrice = useAddPrice(token as string, setIsPriceModalOpen);

  // Fetch profile to get dynamic accessRoutes
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data?.success && data?.data?.accessRoutes) {
          setAccessRoutes(data.data.accessRoutes);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, [token]);

  // Filter navigation based on role
  const navigation = React.useMemo(() => {
    if (userRole === "superadmin") return allNavigation;
    if (userRole === "admin") {
      // Include only routes that exist in accessRoutes
      return allNavigation.filter(
        (item) =>
          item.href === "/" || // always allow dashboard
          accessRoutes.includes(item.href.replace("/", "")) // match API route names
      );
    }
    return [];
  }, [userRole, accessRoutes]);


  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (getPrice?.data?.data?.applicationFee !== undefined) {
      setPrice(getPrice.data.data.applicationFee.toString());
    }
  }, [getPrice?.data?.data?.applicationFee]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const handlePriceSubmit = () => {
    if (price && !isNaN(Number(price))) {
      updatePrice.mutate({ price: Number(price) });
    }
  };

  const renderLinks = () =>
    navigation.map((item) => {
      const isActive =
        pathname === item.href ||
        (item.href === "/settings" && pathname.startsWith("/settings"));

      return (
        <Link
          key={item.name}
          href={item.href}
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 px-4 py-3 text-[18px] font-normal rounded-lg transition-colors w-full text-nowrap",
            isActive
              ? "bg-[#0F3D6133]/20 text-[#0F3D61]"
              : "text-[#0F3D61] hover:bg-[#0F3D6133]/20"
          )}
        >
          <item.icon className="w-5 h-5" />
          <span className="flex-1">{item.name}</span>
        </Link>
      );
    });

  const isSuperAdmin = userRole === "superadmin";

  return (
    <>
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-gray-900/50 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Price Modal */}
      {isPriceModalOpen && isSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-[8px] shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-semibold text-[#0F3D61] mb-4">
              Enter Application Fee
            </h2>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter amount"
              className="w-full border border-gray-300 rounded-lg p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#0F3D61]"
            />
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsPriceModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handlePriceSubmit}
                disabled={updatePrice.isPending}
                className="px-4 flex items-center py-2 rounded-[6px] bg-[#0F3D61] text-white hover:bg-[#0d3454] disabled:opacity-70"
              >
                {updatePrice.isPending && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-[8px] shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-semibold text-[#0F3D61] mb-4">
              Confirm Logout
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to log out?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-[6px] bg-red-600 text-white hover:bg-red-700"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[386px] bg-[#EFEFEF] border-r-[2px] border-[#B3BEC8]">
        <div className="flex items-center justify-center h-[90px] w-[120px] pl-5">
          <Image
            src="/assets/logo.png"
            width={1000}
            height={1000}
            alt="logo"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Nav Links + Price + Logout */}
        <nav className="flex-1 py-6 space-y-1">
          {renderLinks()}

          {/* Price button - Only for superadmin */}
          {isSuperAdmin && (
            <button
              onClick={() => setIsPriceModalOpen(true)}
              className="flex items-center gap-3 px-4 py-3 text-[18px] font-normal text-[#0F3D61] rounded-lg hover:bg-[#0F3D6133]/20 transition-colors w-full"
            >
              <Tag className="w-5 h-5" />
              Price
            </button>
          )}

          {/* Logout button */}
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="flex items-center gap-3 px-4 py-3 text-[18px] font-normal text-red-600 rounded-lg hover:bg-red-50 transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </nav>
      </aside>
    </>
  );
}
