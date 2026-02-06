import { Outlet, NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Brain,
    Dna,
    MessageSquare,
    History,
    Sparkles,
    Layers,
    Settings,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* SIDEBAR NAVIGATION                                                         */
/* -------------------------------------------------------------------------- */
const navItems = [
    { to: "/dashboard", icon: Brain, label: "Geral", end: true },
    { to: "/dashboard/dna", icon: Dna, label: "DNA Mental" },
    { to: "/dashboard/chat", icon: MessageSquare, label: "Comunicação" },
    { to: "/dashboard/history", icon: History, label: "História" },
    { to: "/dashboard/artifacts", icon: Sparkles, label: "Artefatos" },
    { to: "/dashboard/pipeline", icon: Layers, label: "Pipeline" },
];

function Sidebar() {
    return (
        <aside
            className="fixed left-0 top-0 h-screen w-[250px] bg-cyber-void border-r border-white/5 flex flex-col z-50"
            role="navigation"
            aria-label="Menu principal"
        >
            {/* Logo */}
            <div className="p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyber-cyan to-cyber-purple flex items-center justify-center">
                        <Brain className="w-6 h-6 text-white" aria-hidden="true" />
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-lg tracking-tight">EU MAIOR</h1>
                        <span className="text-cyber-text text-xs font-mono">COGNITIVE CORE</span>
                    </div>
                </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 py-4 px-3 space-y-1" aria-label="Navegação do Dashboard">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                                "text-cyber-text hover:text-white hover:bg-white/5",
                                "focus:outline-none focus:ring-2 focus:ring-cyber-cyan/50",
                                isActive && "bg-gradient-to-r from-cyber-cyan/10 to-transparent border-l-2 border-cyber-cyan text-white"
                            )
                        }
                    >
                        <item.icon className="w-5 h-5" aria-hidden="true" />
                        <span className="text-sm font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/5">
                <button
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-cyber-text hover:text-white hover:bg-white/5 transition-colors"
                    aria-label="Configurações"
                >
                    <Settings className="w-5 h-5" aria-hidden="true" />
                    <span className="text-sm">Configurações</span>
                </button>
            </div>
        </aside>
    );
}

/* -------------------------------------------------------------------------- */
/* HEADER WITH BREADCRUMBS AND STATUS                                        */
/* -------------------------------------------------------------------------- */
function Header() {
    const location = useLocation();
    const pathSegments = location.pathname.split("/").filter(Boolean);

    return (
        <header className="h-16 border-b border-white/5 bg-cyber-void/80 backdrop-blur-sm flex items-center justify-between px-6">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
                <span className="text-cyber-text">Mentes</span>
                {pathSegments.map((segment, index) => (
                    <span key={segment} className="flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 text-cyber-text/50" aria-hidden="true" />
                        <span
                            className={cn(
                                index === pathSegments.length - 1 ? "text-white" : "text-cyber-text"
                            )}
                        >
                            {segment.charAt(0).toUpperCase() + segment.slice(1)}
                        </span>
                    </span>
                ))}
            </nav>

            {/* System Status */}
            <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyber-green/10 border border-cyber-green/30"
                role="status"
                aria-live="polite"
            >
                <span className="w-2 h-2 rounded-full bg-cyber-green animate-status-blink" aria-hidden="true" />
                <span className="text-cyber-green text-xs font-mono">SYSTEM OPERATIONAL</span>
            </div>
        </header>
    );
}

/* -------------------------------------------------------------------------- */
/* MAIN LAYOUT COMPONENT                                                      */
/* -------------------------------------------------------------------------- */
export default function DashboardLayout() {
    return (
        <div className="min-h-screen bg-cyber-void text-white">
            {/* Skip to main content link for A11y */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-cyber-cyan focus:text-black focus:rounded"
            >
                Pular para o conteúdo principal
            </a>

            <Sidebar />

            <div className="ml-[250px] min-h-screen flex flex-col">
                <Header />

                <main
                    id="main-content"
                    className="flex-1 p-6"
                    role="main"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        <Outlet />
                    </motion.div>
                </main>
            </div>
        </div>
    );
}
