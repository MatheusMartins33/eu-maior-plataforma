import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NeonCardProps {
    children: React.ReactNode;
    className?: string;
    glowColor?: "cyan" | "purple" | "green" | "gold";
    hoverable?: boolean;
}

const glowColors = {
    cyan: "hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]",
    purple: "hover:shadow-[0_0_20px_rgba(112,0,255,0.3)]",
    green: "hover:shadow-[0_0_20px_rgba(0,255,136,0.3)]",
    gold: "hover:shadow-[0_0_20px_rgba(255,215,0,0.3)]",
};

const borderColors = {
    cyan: "border-cyber-cyan/20 hover:border-cyber-cyan/50",
    purple: "border-cyber-purple/20 hover:border-cyber-purple/50",
    green: "border-cyber-green/20 hover:border-cyber-green/50",
    gold: "border-cyber-gold/20 hover:border-cyber-gold/50",
};

export function NeonCard({
    children,
    className,
    glowColor = "cyan",
    hoverable = true,
}: NeonCardProps) {
    return (
        <motion.div
            className={cn(
                "bg-cyber-surface rounded-lg border transition-all duration-300",
                borderColors[glowColor],
                hoverable && glowColors[glowColor],
                className
            )}
            whileHover={hoverable ? { scale: 1.01 } : undefined}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
            {children}
        </motion.div>
    );
}

export function NeonCardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("p-4 border-b border-white/5", className)}>
            {children}
        </div>
    );
}

export function NeonCardContent({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("p-4", className)}>
            {children}
        </div>
    );
}
