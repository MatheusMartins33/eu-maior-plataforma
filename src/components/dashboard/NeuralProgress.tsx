import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NeuralProgressProps {
    value: number;
    max: number;
    label?: string;
    showValue?: boolean;
    color?: "cyan" | "purple" | "green" | "gold";
    size?: "sm" | "md";
}

const colorClasses = {
    cyan: "from-cyber-cyan to-cyber-cyan/50",
    purple: "from-cyber-purple to-cyber-purple/50",
    green: "from-cyber-green to-cyber-green/50",
    gold: "from-cyber-gold to-cyber-gold/50",
};

export function NeuralProgress({
    value,
    max,
    label = "Neural Data",
    showValue = true,
    color = "cyan",
    size = "md",
}: NeuralProgressProps) {
    const percentage = Math.min((value / max) * 100, 100);

    return (
        <div
            className="w-full"
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-label={`${label}: ${value} de ${max}`}
        >
            <div className="flex justify-between items-center mb-2">
                <span className={cn(
                    "font-mono uppercase text-cyber-text",
                    size === "sm" ? "text-xs" : "text-sm"
                )}>
                    {label}
                </span>
                {showValue && (
                    <span className={cn(
                        "font-mono text-white",
                        size === "sm" ? "text-xs" : "text-sm"
                    )}>
                        {value} / {max}
                    </span>
                )}
            </div>

            <div className={cn(
                "w-full bg-white/5 rounded-full overflow-hidden",
                size === "sm" ? "h-1.5" : "h-2"
            )}>
                <motion.div
                    className={cn("h-full bg-gradient-to-r rounded-full", colorClasses[color])}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
                />
            </div>
        </div>
    );
}
