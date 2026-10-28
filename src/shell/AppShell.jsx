import {
  ArrowUpRight,
  Bot,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Package,
  Route,
  Settings,
  UserRoundPlus,
  Users,
  Wallet,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { PAGE_PATHS } from "./routes.js";

const navItems = [
  { key: "dashboard", label: "Обзор", icon: LayoutDashboard },
  { key: "orders", label: "Заказы", icon: Package },
  { key: "executors", label: "Исполнители", icon: Users },
  { key: "routes", label: "Маршруты", icon: Route },
  {
    key: "assistant",
    label: (
      <>
        Интеллектуальный
        <br />
        помощник
      </>
    ),
    icon: Bot,
    title: "Интеллектуальный помощник",
  },
  { key: "reports", label: "Отчёты", icon: FileText },
  { key: "finance", label: "Финансы", icon: Wallet },
  { key: "admin", label: "Администрирование", icon: UserRoundPlus },
];

export function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <ArrowUpRight size={21} />
      </span>
      <span>DELIVERY / OS</span>
    </div>
  );
}

function Sidebar({ collapsed, setCollapsed }) {
  return (
    <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
      <div className="sidebar-top">
        <Brand />
        <button
          className="collapse-button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Развернуть меню" : "Свернуть меню"}
        >
          {collapsed ? <ChevronRight size={19} /> : <ChevronLeft size={19} />}
        </button>
      </div>
      <div className="nav-caption">РАБОЧЕЕ ПРОСТРАНСТВО</div>
      <nav>
        {navItems.map(({ key, label, icon: Icon, title }) => (
          <NavLink
            key={key}
            to={PAGE_PATHS[key]}
            end={key === "dashboard"}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            title={
              title ||
              (typeof label === "string" ? label : "Интеллектуальный помощник")
            }
          >
            <Icon size={16} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <NavLink
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          to={PAGE_PATHS.settings}
        >
          <Settings size={16} />
          <span>Настройки</span>
        </NavLink>
        <div className="user-chip">
          <span className="avatar">Л</span>
          <div>
            <b>Логист</b>
            <small>Рабочая смена</small>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function AppShell({
  collapsed,
  setCollapsed,
  theme = "light",
  children,
}) {
  return (
    <div className="app-shell" data-theme={theme}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className="main-content">{children}</main>
    </div>
  );
}
