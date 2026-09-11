"use client"

import * as React from "react"
import { NavMain, type NavItem } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  UsersIcon,
  PackageIcon,
  BoxesIcon,
  ShoppingCartIcon,
  Settings2Icon,
  Building2Icon,
} from "lucide-react"

const sidebarData = {
  teams: [
    {
      name: "Mecca",
      logo: <Building2Icon className="size-4" />,
      plan: "Enterprise ERP",
    },
  ],
  overview: [
    {
      title: "Dashboard Overview",
      url: "/",
      icon: <LayoutDashboardIcon className="size-4" />,
    },
  ] as NavItem[],
  modules: [
    {
      title: "Customers",
      url: "/customers",
      icon: <UsersIcon className="size-4" />,
      isActive: true,
      items: [
        {
          title: "Daftar Customer",
          url: "/customers",
        },
      ],
    },
    {
      title: "Produk & Kategori",
      url: "/products",
      icon: <PackageIcon className="size-4" />,
      items: [
        {
          title: "Daftar Produk",
          url: "/products",
        },
        {
          title: "Daftar Kategori",
          url: "/products/categories",
        },
      ],
    },
    {
      title: "Inventaris dan Stok",
      url: "/inventory",
      icon: <BoxesIcon className="size-4" />,
      items: [
        {
          title: "Daftar Stok",
          url: "/inventory",
        },
        {
          title: "Stok Opname",
          url: "/inventory/opname",
        },
        {
          title: "Stok Terbuang",
          url: "/inventory/waste",
        },
      ],
    },
    {
      title: "Penjualan",
      url: "/sales-orders",
      icon: <ShoppingCartIcon className="size-4" />,
      items: [
        {
          title: "Daftar Penawaran Penjualan",
          url: "/quotations",
        },
        {
          title: "Daftar Pesanan Penjualan",
          url: "/sales-orders",
        },
        {
          title: "Daftar Pengiriman Penjualan",
          url: "/deliveries",
        },
        {
          title: "Daftar Invoice",
          url: "/invoices",
        },
        {
          title: "Daftar Payments",
          url: "/payments",
        },
      ],
    },
    {
      title: "Settings",
      url: "/settings/users",
      icon: <Settings2Icon className="size-4" />,
      items: [
        {
          title: "Daftar Users",
          url: "/settings/users",
        },
        {
          title: "Role & Hak Akses",
          url: "/settings/roles",
        },
        {
          title: "Daftar Warehouse",
          url: "/settings/warehouses",
        },
      ],
    },
  ] as NavItem[],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarData.overview} />
        <NavMain items={sidebarData.modules} label="Modul Operasional" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
