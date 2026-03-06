import { useRef, useCallback } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, X } from "lucide-react";

const C = {
    bg: "#000000",
    card: "#0b0b0b",
    text: "#e6eef8",
    muted: "#9aa7b8",
    primary: "#7dd3fc",
    accent: "#ff6fb5",
    border: "#1a1a1a",
};

export default function QrModal({ url, onClose }) {
    const canvasRef = useRef(null);

    const handleDownload = useCallback(() => {
        const canvas = canvasRef.current?.querySelector("canvas");
        if (!canvas) return;
        const link = document.createElement("a");
        link.download = `nanoalias-qr-${url.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    }, [url]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={onClose}
        >
            <div
                className="relative rounded-2xl p-8 shadow-2xl w-full max-w-sm"
                style={{ background: C.card, border: `1px solid ${C.border}` }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-lg transition hover:bg-white/10"
                    style={{ color: C.muted }}
                >
                    <X size={18} />
                </button>

                <h3 className="text-lg font-semibold mb-1 pr-8" style={{ color: C.text }}>
                    QR Code
                </h3>
                <p className="text-xs mb-6 truncate" style={{ color: C.muted }}>{url}</p>

                <div
                    ref={canvasRef}
                    className="flex justify-center mb-6"
                >
                    <div className="bg-white rounded-xl p-4">
                        <QRCodeCanvas
                            value={url}
                            size={200}
                            bgColor="#ffffff"
                            fgColor="#0f172a"
                            level="H"
                            includeMargin={false}
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleDownload}
                        className="glow-primary flex-1 py-2.5 rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 text-sm"
                        style={{ background: C.primary, color: C.bg }}
                    >
                        <Download size={16} />
                        Download PNG
                    </button>
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-lg text-sm font-medium transition hover:bg-white/10"
                        style={{ border: `1px solid ${C.border}`, color: C.muted }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
