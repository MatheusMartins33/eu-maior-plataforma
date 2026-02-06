import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

interface BigFiveData {
    trait: string;
    value: number;
    fullMark: number;
}

interface BigFiveRadarProps {
    data: BigFiveData[];
    showLabels?: boolean;
}

const defaultData: BigFiveData[] = [
    { trait: "Abertura", value: 75, fullMark: 100 },
    { trait: "Conscienciosidade", value: 85, fullMark: 100 },
    { trait: "Extroversão", value: 45, fullMark: 100 },
    { trait: "Amabilidade", value: 60, fullMark: 100 },
    { trait: "Neuroticismo", value: 35, fullMark: 100 },
];

export function BigFiveRadar({ data = defaultData, showLabels = true }: BigFiveRadarProps) {
    return (
        <div
            className="w-full h-[300px]"
            role="img"
            aria-label="Gráfico radar dos traços de personalidade Big Five"
        >
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid
                        stroke="rgba(255,255,255,0.1)"
                        strokeDasharray="3 3"
                    />
                    {showLabels && (
                        <PolarAngleAxis
                            dataKey="trait"
                            tick={{ fill: "#94A3B8", fontSize: 12, fontFamily: "monospace" }}
                        />
                    )}
                    <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={false}
                        axisLine={false}
                    />
                    <Radar
                        name="Perfil"
                        dataKey="value"
                        stroke="#00F0FF"
                        fill="url(#radarGradient)"
                        fillOpacity={0.4}
                        strokeWidth={2}
                    />
                    <defs>
                        <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#00F0FF" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#7000FF" stopOpacity={0.4} />
                        </linearGradient>
                    </defs>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#0A0A0F",
                            border: "1px solid rgba(0,240,255,0.3)",
                            borderRadius: "8px",
                            color: "#fff",
                        }}
                        formatter={(value: number) => [`${value}%`, "Valor"]}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
