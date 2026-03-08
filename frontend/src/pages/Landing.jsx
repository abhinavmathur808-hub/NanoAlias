import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Footer from "../components/Footer";
import {
    Link as LinkIcon,
    Globe,
    QrCode,
    Database,
    Lock,
    Cloud,
    Shield,
    Keyboard,
    Clock,
    Smartphone,
    Wifi,
    Layers,
    Zap,
    Server,
    Code,
    Terminal,
} from "lucide-react";

const DiamondHalo = ({ centerX = 400, centerY = 400 }) => {
    const rings = [
        { radius: 165, dotCount: 20, dotSize: 2.0, baseOpacity: 0.5 },
        { radius: 178, dotCount: 26, dotSize: 3.0, baseOpacity: 0.7 },
        { radius: 192, dotCount: 30, dotSize: 3.5, baseOpacity: 0.85 },
        { radius: 206, dotCount: 34, dotSize: 4.0, baseOpacity: 1.0 },
        { radius: 220, dotCount: 36, dotSize: 3.5, baseOpacity: 0.85 },
        { radius: 234, dotCount: 40, dotSize: 3.0, baseOpacity: 0.7 },
        { radius: 250, dotCount: 44, dotSize: 2.0, baseOpacity: 0.5 },
        { radius: 265, dotCount: 48, dotSize: 1.5, baseOpacity: 0.35 },
    ];

    const generateDiamondPoints = (radius, count) => {
        const points = [];
        const angleOffset = -Math.PI / 2;
        for (let i = 0; i < 4; i++) {
            const angle1 = i * (Math.PI / 2) + angleOffset;
            const angle2 = (i + 1) * (Math.PI / 2) + angleOffset;
            const x1 = centerX + radius * Math.cos(angle1);
            const y1 = centerY + radius * Math.sin(angle1);
            const x2 = centerX + radius * Math.cos(angle2);
            const y2 = centerY + radius * Math.sin(angle2);
            const dotsPerSide = count / 4;
            for (let j = 0; j < dotsPerSide; j++) {
                const t = j / dotsPerSide;
                points.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t });
            }
        }
        return points;
    };

    return (
        <svg
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none"
            viewBox="0 0 800 800"
            xmlns="http://www.w3.org/2000/svg"
            style={{ zIndex: 5 }}
        >
            {rings.map((ring, rIndex) =>
                generateDiamondPoints(ring.radius, ring.dotCount).map((pt, pIndex) => {
                    const globalIdx = rIndex * 50 + pIndex;
                    const delay = ((globalIdx * 137) % 100) / 100;
                    const sizeJitter = ring.dotSize + ((globalIdx % 3) - 1) * 0.4;
                    const opacityJitter = Math.min(1, ring.baseOpacity + ((globalIdx % 5) - 2) * 0.08);
                    return (
                        <circle
                            key={`${rIndex}-${pIndex}`}
                            cx={pt.x}
                            cy={pt.y}
                            r={Math.max(1, sizeJitter)}
                            fill="#CEB372"
                            fillOpacity={opacityJitter}
                            style={{ animation: `twinkle 3s ease-in-out ${delay}s infinite alternate` }}
                        />
                    );
                })
            )}
        </svg>
    );
};

export default function Landing() {
    const navigate = useNavigate();
    const { token } = useSelector((state) => state.auth);

    const handleShortenClick = () => {
        navigate(token ? "/dashboard" : "/register");
    };

    const richColors = ["#E2242A", "#CEB372", "#50C878", "#4A90D9", "#9B59B6", "#E67E22"];
    const rays = Array.from({ length: 36 }, (_, i) => {
        const angle = (360 / 36) * i;
        const rad = (angle * Math.PI) / 180;
        const isDashed = i % 3 === 0;
        const hasDot = i % 4 === 0;
        const len = 44 + (i % 2 === 0 ? 0 : 6);
        const innerStart = 23;
        const x1 = 50 + innerStart * Math.cos(rad);
        const y1 = 50 + innerStart * Math.sin(rad);
        const x2 = 50 + len * Math.cos(rad);
        const y2 = 50 + len * Math.sin(rad);
        const color = richColors[i % richColors.length];
        return { x1, y1, x2, y2, isDashed, hasDot, color };
    });

    const halo = Array.from({ length: 60 }, (_, i) => {
        const angle = (360 / 60) * i;
        const rad = (angle * Math.PI) / 180;
        const r = 14 + (i % 3) * 1.5;
        return { cx: 50 + r * Math.cos(rad), cy: 50 + r * Math.sin(rad) };
    });

    return (
        <div className="min-h-screen bg-black relative overflow-hidden flex flex-col items-center justify-center" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {/* ── Rich SVG Sunburst + Stippled Halo ── */}
            <svg
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] h-[200vw] md:w-[1200px] md:h-[1200px] pointer-events-none"
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
                style={{ zIndex: 0 }}
            >
                {/* Stippled Halo */}
                {halo.map(({ cx, cy }, i) => (
                    <circle
                        key={`h-${i}`}
                        cx={cx}
                        cy={cy}
                        r="0.25"
                        fill="#CEB372"
                        fillOpacity={0.3 + (i % 3) * 0.15}
                    />
                ))}
                {/* Radiating Lines */}
                {rays.map(({ x1, y1, x2, y2, isDashed, hasDot, color }, i) => (
                    <g key={`r-${i}`}>
                        <line
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={color}
                            strokeWidth={i % 2 === 0 ? "0.25" : "0.4"}
                            strokeOpacity={isDashed ? "0.25" : "0.5"}
                            strokeDasharray={isDashed ? "1.5 1" : "none"}
                        />
                        {hasDot && (
                            <circle
                                cx={x2}
                                cy={y2}
                                r="0.4"
                                fill={color}
                                fillOpacity="0.6"
                            />
                        )}
                    </g>
                ))}
            </svg>

            {/* ── Ambient Glow ── */}
            <div className="absolute w-[500px] h-[500px] rounded-full bg-red-600/10 blur-[120px] pointer-events-none" />
            <div className="absolute w-[300px] h-[300px] rounded-full bg-amber-500/10 blur-[100px] translate-x-32 -translate-y-20 pointer-events-none" />

            {/* ── Floating Tech Icons ── */}

            {/* --- TOP LEFT CLUSTER --- */}
            <div className="absolute top-[18%] left-[16%] bg-black rounded-full p-2 flex items-center justify-center rotate-12 hidden md:block hover:scale-125 transition-all duration-300 ease-out cursor-pointer" style={{ animation: "floatIcon 4s ease-in-out 0s infinite alternate" }}><QrCode className="w-12 h-12 text-white" strokeWidth={1.5} /></div>
            <div className="absolute top-[30%] left-[8%] bg-black rounded-full p-2 flex items-center justify-center -rotate-12 hidden md:block hover:scale-125 transition-all duration-300 ease-out cursor-pointer" style={{ animation: "floatIcon 4s ease-in-out 0.4s infinite alternate" }}><Globe className="w-12 h-12 text-white opacity-70" strokeWidth={1.5} /></div>
            <div className="absolute top-[45%] left-[15%] bg-black rounded-full p-2 flex items-center justify-center hidden md:block hover:scale-125 transition-all duration-300 ease-out cursor-pointer" style={{ animation: "floatIcon 4s ease-in-out 0.8s infinite alternate" }}><Database className="w-12 h-12 text-white" strokeWidth={1.5} /></div>
            <div className="absolute top-[12%] left-[30%] bg-black rounded-full p-2 flex items-center justify-center rotate-6 hidden md:block hover:scale-125 transition-all duration-300 ease-out cursor-pointer" style={{ animation: "floatIcon 4s ease-in-out 1.2s infinite alternate" }}><Shield className="w-12 h-12 text-white opacity-70" strokeWidth={1.5} /></div>

            {/* --- BOTTOM LEFT CLUSTER --- */}
            <div className="absolute bottom-[35%] left-[12%] bg-black rounded-full p-2 flex items-center justify-center -rotate-12 hidden md:block hover:scale-125 transition-all duration-300 ease-out cursor-pointer" style={{ animation: "floatIcon 4s ease-in-out 0.2s infinite alternate" }}><LinkIcon className="w-12 h-12 text-white" strokeWidth={1.5} /></div>
            <div className="absolute bottom-[20%] left-[18%] bg-black rounded-full p-2 flex items-center justify-center rotate-6 hidden md:block hover:scale-125 transition-all duration-300 ease-out cursor-pointer" style={{ animation: "floatIcon 4s ease-in-out 1s infinite alternate" }}><Keyboard className="w-12 h-12 text-white" strokeWidth={1.5} /></div>
            <div className="absolute bottom-[10%] left-[30%] bg-black rounded-full p-2 flex items-center justify-center rotate-12 hidden md:block hover:scale-125 transition-all duration-300 ease-out cursor-pointer" style={{ animation: "floatIcon 4s ease-in-out 0.6s infinite alternate" }}><Clock className="w-12 h-12 text-white opacity-80" strokeWidth={1.5} /></div>
            <div className="absolute bottom-[25%] left-[28%] bg-black rounded-full p-2 flex items-center justify-center -rotate-12 hidden md:block hover:scale-125 transition-all duration-300 ease-out cursor-pointer" style={{ animation: "floatIcon 4s ease-in-out 1.4s infinite alternate" }}><Zap className="w-12 h-12 text-white" strokeWidth={1.5} /></div>

            {/* --- TOP RIGHT CLUSTER --- */}
            <div className="absolute top-[20%] right-[22%] bg-black rounded-full p-2 flex items-center justify-center -rotate-6 hidden md:block hover:scale-125 transition-all duration-300 ease-out cursor-pointer" style={{ animation: "floatIcon 4s ease-in-out 0.3s infinite alternate" }}><Lock className="w-12 h-12 text-white" strokeWidth={1.5} /></div>
            <div className="absolute top-[10%] right-[35%] bg-black rounded-full p-2 flex items-center justify-center rotate-12 hidden md:block hover:scale-125 transition-all duration-300 ease-out cursor-pointer" style={{ animation: "floatIcon 4s ease-in-out 0.7s infinite alternate" }}><Cloud className="w-12 h-12 text-white opacity-70" strokeWidth={1.5} /></div>
            <div className="absolute top-[38%] right-[15%] bg-black rounded-full p-2 flex items-center justify-center rotate-12 hidden md:block hover:scale-125 transition-all duration-300 ease-out cursor-pointer" style={{ animation: "floatIcon 4s ease-in-out 1.1s infinite alternate" }}><Smartphone className="w-12 h-12 text-white" strokeWidth={1.5} /></div>
            <div className="absolute top-[15%] right-[12%] bg-black rounded-full p-2 flex items-center justify-center -rotate-12 hidden md:block hover:scale-125 transition-all duration-300 ease-out cursor-pointer" style={{ animation: "floatIcon 4s ease-in-out 0.5s infinite alternate" }}><Wifi className="w-12 h-12 text-white opacity-80" strokeWidth={1.5} /></div>

            {/* --- BOTTOM RIGHT CLUSTER --- */}
            <div className="absolute bottom-[28%] right-[20%] bg-black rounded-full p-2 flex items-center justify-center -rotate-6 hidden md:block hover:scale-125 transition-all duration-300 ease-out cursor-pointer" style={{ animation: "floatIcon 4s ease-in-out 0.9s infinite alternate" }}><Server className="w-12 h-12 text-white" strokeWidth={1.5} /></div>
            <div className="absolute bottom-[40%] right-[8%] bg-black rounded-full p-2 flex items-center justify-center -rotate-12 hidden md:block hover:scale-125 transition-all duration-300 ease-out cursor-pointer" style={{ animation: "floatIcon 4s ease-in-out 1.3s infinite alternate" }}><Layers className="w-12 h-12 text-white opacity-80" strokeWidth={1.5} /></div>
            <div className="absolute bottom-[12%] right-[32%] bg-black rounded-full p-2 flex items-center justify-center -rotate-6 hidden md:block hover:scale-125 transition-all duration-300 ease-out cursor-pointer" style={{ animation: "floatIcon 4s ease-in-out 0.4s infinite alternate" }}><Code className="w-12 h-12 text-white" strokeWidth={1.5} /></div>
            <div className="absolute bottom-[15%] right-[15%] bg-black rounded-full p-2 flex items-center justify-center rotate-12 hidden md:block hover:scale-125 transition-all duration-300 ease-out cursor-pointer" style={{ animation: "floatIcon 4s ease-in-out 0.8s infinite alternate" }}><Terminal className="w-12 h-12 text-white opacity-70" strokeWidth={1.5} /></div>

            {/* --- Floating Crystals / Diamonds --- */}
            <div className="absolute top-[30%] left-[20%] w-4 h-4 bg-[#FCF4E4] rotate-45 shadow-sm border border-[#CEB372]/30 hidden md:block" style={{ animation: "floatIcon 5s ease-in-out 0.3s infinite alternate" }} />
            <div className="absolute bottom-[22%] right-[20%] w-5 h-5 bg-white/90 rotate-45 shadow-md border border-[#CEB372]/20 hidden md:block" style={{ animation: "floatIcon 5s ease-in-out 0.8s infinite alternate" }} />
            <div className="absolute top-[8%] right-[40%] w-3 h-3 bg-[#CEB372]/40 rotate-45 shadow-sm hidden md:block" style={{ animation: "floatIcon 6s ease-in-out 0.1s infinite alternate" }} />
            <div className="absolute bottom-[10%] left-[40%] w-4 h-4 bg-white/80 rotate-45 shadow-sm border border-[#CEB372]/25 hidden md:block" style={{ animation: "floatIcon 5s ease-in-out 1.2s infinite alternate" }} />
            <div className="absolute top-[52%] right-[6%] w-3 h-3 bg-[#FCF4E4] rotate-45 shadow-sm border border-[#CEB372]/30 hidden md:block" style={{ animation: "floatIcon 6s ease-in-out 0.6s infinite alternate" }} />

            {/* --- Stippling dots --- */}
            <div className="absolute top-[30%] left-[35%] w-2 h-2 bg-white rounded-full opacity-60 hidden md:block" />
            <div className="absolute bottom-[30%] right-[35%] w-2 h-2 bg-[#CEB372] rounded-full opacity-70 hidden md:block" />

            {/* ── Diamond Dot Halo ── */}
            <DiamondHalo />

            {/* ── Tagline ── */}
            <p
                className="relative z-10 text-xl md:text-3xl font-semibold text-gray-200 text-center mb-8"
                style={{ textShadow: "0 2px 12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 0, 0, 0.5)" }}
            >
                Create links that do more than redirect
            </p>

            {/* ── Central Ruby Shape ── */}
            <div
                className="relative z-10 w-[200px] h-[200px] sm:w-[255px] sm:h-[255px] md:w-[310px] md:h-[310px]
                           rotate-45 transition-transform duration-300 hover:scale-[1.03]"
                style={{
                    borderRadius: "18%",
                    background: "#E2242A",
                    boxShadow: "0 8px 40px rgba(226, 36, 42, 0.4)",
                }}
            >
                <div className="-rotate-45 w-full h-full flex flex-col items-center justify-center text-white">
                    <p className="text-base sm:text-lg font-semibold tracking-wide text-white/80 mb-2 mt-4">
                        Quick. Secure. Reliable.
                    </p>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-wide leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>
                        NanoAlias
                    </h1>
                    <p className="text-white text-lg sm:text-xl font-medium mt-1 sm:mt-2 mb-4 sm:mb-6 opacity-90">
                        ~by{" "}
                        <a
                            href="https://www.linkedin.com/in/abhinav-mathur-669414356"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="creator-link"
                        >
                            Abhinav Mathur
                        </a>
                    </p>
                    <button
                        onClick={handleShortenClick}
                        className="bg-white text-[#E2242A] font-bold px-8 sm:px-10 py-3 sm:py-3.5 rounded-full
                                   hover:bg-gray-100 transition-all duration-200 shadow-md
                                   hover:scale-105 hover:shadow-lg text-lg sm:text-xl"
                    >
                        Shorten Now
                    </button>
                </div>
            </div>



            {/* ── Keyframe Animation ── */}
            <Footer />

            <style>{`
                @keyframes floatIcon {
                    0%   { transform: translateY(0px); }
                    100% { transform: translateY(-14px); }
                }
                @keyframes twinkle {
                    0%   { opacity: 1; }
                    50%  { opacity: 0.3; }
                    100% { opacity: 1; }
                }
                .creator-link {
                    color: inherit;
                    text-decoration: none;
                    transition: color 0.3s ease, text-shadow 0.3s ease;
                }
                .creator-link:hover {
                    color: #CEB372;
                    text-shadow: 0 0 8px rgba(206, 179, 114, 0.6);
                }
            `}</style>
        </div>
    );
}
