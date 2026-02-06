import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ApexGaugeProps {
    value: number;
    max?: number;
    label?: string;
    size?: "sm" | "md" | "lg";
}

const sizes = {
    sm: { container: "w-24 h-24", text: "text-xl", label: "text-xs" },
    md: { container: "w-32 h-32", text: "text-2xl", label: "text-xs" },
    lg: { container: "w-40 h-40", text: "text-3xl", label: "text-sm" },
};

export function ApexGauge({ value, max = 10, label = "Apex Score", size = "md" }: ApexGaugeProps) {
    const percentage = (value / max) * 100;
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div
            className={cn("relative flex items-center justify-center", sizes[size].container)}
            role="meter"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-label={`${label}: ${value} de ${max}`}
        >
            <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="4"
                />
                <motion.circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    fill="none"
                    stroke="url(#gaugeGradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
                />
                <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00F0FF" />
                        <stop offset="100%" stopColor="#7000FF" />
                    </linearGradient>
                </defs>
            </svg>

            <div className="text-center z-10">
                <motion.span
                    className={cn("font-bold text-white block", sizes[size].text)}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    {value.toFixed(1)}
                </motion.span>
                <span className={cn("text-cyber-text font-mono", sizes[size].label)}>/ {max}</span>
            </div>
        </div>
    );
}
