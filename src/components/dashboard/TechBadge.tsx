import { cn } from "@/lib/utils";

interface TechBadgeProps {
    label: string;
    value: string;
    variant?: "cyan" | "purple" | "green" | "gold";
    icon?: React.ReactNode;
}

const variantStyles = {
    cyan: "border-cyber-cyan/30 bg-cyber-cyan/5 text-cyber-cyan",
    purple: "border-cyber-purple/30 bg-cyber-purple/5 text-cyber-purple",
    green: "border-cyber-green/30 bg-cyber-green/5 text-cyber-green",
    gold: "border-cyber-gold/30 bg-cyber-gold/5 text-cyber-gold",
};

export function TechBadge({ label, value, variant = "cyan", icon }: TechBadgeProps) {
    return (
        <div
            className={cn(
                "inline-flex items-center gap-2 px-3 py-2 rounded-lg border",
                "transition-all duration-200 hover:scale-105",
                variantStyles[variant]
            )}
        >
            {icon && <span className="w-4 h-4" aria-hidden="true">{icon}</span>}
            <span className="text-xs font-mono uppercase text-cyber-text">{label}</span>
            <span className="text-sm font-bold">{value}</span>
        </div>
    );
}
