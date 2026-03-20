import { useState, useCallback, useMemo, useEffect } from "react";

const LOGO_SRC = "/lrpp-logo.jpeg";

// ─── RATE DATA ───────────────────────────────────────────────────
const ROLL_SIZES = [3, 4, 5, 6, 8, 10];

const DEFAULT_MATERIAL_CATEGORIES = {
    flexes: {
        label: "Flexes",
        unit: "sq ft",
        hasSubcategory: true,
        subcategoryLabel: "GSM",
        items: [
            { id: "flex200", name: "200 GSM", rate: 15 },
            { id: "flex220", name: "220 GSM", rate: 18 },
            { id: "backlight", name: "Backlight", rate: 50 },
            { id: "blackout", name: "Blackout", rate: 20 },
        ],
    },
    vinyl: {
        label: "Vinyl",
        unit: "sq ft",
        items: [{ id: "vinyl", name: "Vinyl", rate: 45 }],
    },
    oneWay: {
        label: "One Way Vision",
        unit: "sq ft",
        items: [{ id: "oneWay", name: "One Way Vision", rate: 50 }],
    },
    retroFlex: {
        label: "Retro Flex",
        unit: "sq ft",
        items: [{ id: "retroFlex", name: "Retro Flex", rate: 50 }],
    },
    retroVinyl: {
        label: "Retro Vinyl",
        unit: "sq ft",
        items: [{ id: "retroVinyl", name: "Retro Vinyl", rate: 75 }],
    },
    sunboard: {
        label: "Sunboard",
        unit: "sq ft",
        hasSubcategory: true,
        subcategoryLabel: "Thickness",
        items: [
            { id: "sunboard3", name: "3mm", rate: 75 },
            { id: "sunboard5", name: "5mm", rate: 100 },
        ],
    },
    acrylic: {
        label: "Acrylic",
        unit: "sq ft",
        hasSubcategory: true,
        subcategoryLabel: "Thickness",
        isAcrylic: true,
        items: [
            { id: "acrylic2", name: "2mm", rate: 20, unitLabel: "per inch" },
            { id: "acrylic4", name: "4mm", rate: 30, unitLabel: "per inch" },
        ],
    },
    acp: {
        label: "ACP",
        unit: "sq ft",
        items: [{ id: "acp", name: "ACP", rate: 175 }],
    },
    letterBoard: {
        label: "3D Letter Board",
        unit: "running inch",
        isLetterBoard: true,
        hasSubcategory: true,
        subcategoryLabel: "Type",
        items: [
            { id: "acrylicNoLed", name: "Without LED", rate: 50 },
            { id: "acrylicLed", name: "With LED", rate: 90 },
        ],
    },
};

const DEFAULT_FRAME_RATES = [
    { label: "2 kg", weight: 2, rate: 10 },
    { label: "3 kg", weight: 3, rate: 15 },
    { label: "5 kg", weight: 5, rate: 25 },
    { label: "9 kg", weight: 9, rate: 45 },
];

const DEFAULT_CONSTANTS = {
    TRANSPORT_RATE: 20,
    INSTALLATION_RATE: 6,
    WELDING_PER_SUPPORT: 20,
    REVERSE_CUTTING_BASE: 1000,
    REVERSE_CUTTING_PER_INCH: 75,
    SUPPORT_EVERY_FT: 4,
    LED_COST: 50,
};

const C = {
    bg: "#FAF9F7",
    fg: "#1A1A1A",
    muted: "#EDE8E2",
    mutedFg: "#7A7168",
    blue: "#2B6A8A",
    blueDark: "#1E4D66",
    blueLight: "#3A8AB5",
    orange: "#E07B30",
    orangeLight: "#F09A56",
    card: "#FFFFFF",
    border: "rgba(26,26,26,0.12)",
    borderStrong: "rgba(26,26,26,0.25)",
};

function getEffectiveRollWidth(w) {
    for (const s of ROLL_SIZES) if (w <= s) return s;
    return ROLL_SIZES[ROLL_SIZES.length - 1];
}

function formatINR(n) {
    if (!n) return "₹0.00";
    return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Overline({ children, light }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
            <div style={{ width: 32, height: 1, background: C.orange }} />
            <span style={{
                fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 500,
                letterSpacing: "0.25em", textTransform: "uppercase",
                color: light ? "rgba(255,255,255,0.5)" : C.mutedFg,
            }}>{children}</span>
        </div>
    );
}

function FieldLabel({ children }) {
    return (
        <label style={{
            fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 500,
            letterSpacing: "0.2em", textTransform: "uppercase",
            color: C.mutedFg, display: "block", marginBottom: 8,
        }}>{children}</label>
    );
}

function UnderlineInput({ label, value, onChange, suffix, step }) {
    return (
        <div style={{ flex: 1 }}>
            <FieldLabel>{label}</FieldLabel>
            <div style={{ position: "relative" }}>
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    step={step}
                    style={{
                        width: "100%", height: 48, background: "transparent",
                        border: "none", borderBottom: `1px solid ${C.borderStrong}`,
                        fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 400,
                        color: C.fg, padding: 0, paddingRight: suffix ? 36 : 0, outline: "none",
                        transition: "border-color 700ms ease-out",
                    }}
                    onFocus={(e) => e.target.style.borderBottomColor = C.orange}
                    onBlur={(e) => e.target.style.borderBottomColor = C.borderStrong}
                />
                {suffix && (
                    <span style={{
                        position: "absolute", right: 0, bottom: 14,
                        fontFamily: "'Inter', sans-serif", fontSize: 11,
                        letterSpacing: "0.15em", textTransform: "uppercase", color: C.mutedFg,
                    }}>{suffix}</span>
                )}
            </div>
        </div>
    );
}

function UnderlineSelect({ label, value, onChange, options }) {
    return (
        <div style={{ flex: 1 }}>
            <FieldLabel>{label}</FieldLabel>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    width: "100%", height: 48, background: "transparent",
                    border: "none", borderBottom: `1px solid ${C.borderStrong}`,
                    fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 400,
                    color: C.fg, padding: 0, outline: "none", cursor: "pointer",
                    appearance: "none",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%237A7168' stroke-width='1.2'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat", backgroundPosition: "right 0 center",
                    transition: "border-color 700ms ease-out",
                }}
                onFocus={(e) => e.target.style.borderBottomColor = C.orange}
                onBlur={(e) => e.target.style.borderBottomColor = C.borderStrong}
            >
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    );
}

function ToggleSwitch({ label, sublabel, checked, onChange }) {
    return (
        <div onClick={() => onChange(!checked)} style={{
            display: "flex", alignItems: "flex-start", gap: 16, cursor: "pointer",
            padding: "16px 0", borderBottom: `1px solid ${C.border}`, transition: "all 500ms ease-out",
        }}>
            <div style={{
                width: 40, height: 20, marginTop: 2, flexShrink: 0,
                border: `1px solid ${checked ? C.orange : C.borderStrong}`,
                background: checked ? C.orange : "transparent",
                position: "relative", transition: "all 500ms ease-out",
            }}>
                <div style={{
                    width: 14, height: 14, position: "absolute", top: 2,
                    background: checked ? "#fff" : C.mutedFg,
                    left: checked ? 22 : 2,
                    transition: "all 500ms cubic-bezier(0.25,0.46,0.45,0.94)",
                }} />
            </div>
            <div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500, color: C.fg }}>{label}</div>
                {sublabel && <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: C.mutedFg, marginTop: 2 }}>{sublabel}</div>}
            </div>
        </div>
    );
}

function SettingsModal({ isOpen, onClose, settings, onSave }) {
    const [localSettings, setLocalSettings] = useState(settings);

    useEffect(() => {
        if (isOpen) setLocalSettings(settings);
    }, [isOpen, settings]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    const updateMaterialRate = (catKey, itemId, newRate) => {
        setLocalSettings(prev => {
            const next = { ...prev };
            next.materials = { ...prev.materials };
            next.materials[catKey] = { ...prev.materials[catKey] };
            next.materials[catKey].items = prev.materials[catKey].items.map(item =>
                item.id === itemId ? { ...item, rate: parseFloat(newRate) || 0 } : item
            );
            return next;
        });
    };

    const updateFrameRate = (weight, newRate) => {
        setLocalSettings(prev => ({
            ...prev,
            frames: prev.frames.map(f => f.weight === weight ? { ...f, rate: parseFloat(newRate) || 0 } : f)
        }));
    };

    const updateConstant = (key, val) => {
        setLocalSettings(prev => ({
            ...prev,
            constants: { ...prev.constants, [key]: parseFloat(val) || 0 }
        }));
    };

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
            <div style={{ background: C.bg, width: "100%", maxWidth: 800, maxHeight: "90vh", overflow: "auto", borderRadius: 8, padding: 40 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: C.fg }}>Edit Default Costs</h2>
                    <button onClick={onClose} style={{ cursor: "pointer", background: "none", border: "none", fontSize: 28, color: C.fg }}>&times;</button>
                </div>

                <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, marginBottom: 16, color: C.fg }}>Service & Add-on Rates</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 40 }}>
                    <UnderlineInput label="Transport Rate (per km)" value={localSettings.constants.TRANSPORT_RATE} onChange={v => updateConstant('TRANSPORT_RATE', v)} />
                    <UnderlineInput label="Installation Rate (per sq ft)" value={localSettings.constants.INSTALLATION_RATE} onChange={v => updateConstant('INSTALLATION_RATE', v)} />
                    <UnderlineInput label="Welding (per joint)" value={localSettings.constants.WELDING_PER_SUPPORT} onChange={v => updateConstant('WELDING_PER_SUPPORT', v)} />
                    <UnderlineInput label="Rev. Cutting Base (₹)" value={localSettings.constants.REVERSE_CUTTING_BASE} onChange={v => updateConstant('REVERSE_CUTTING_BASE', v)} />
                    <UnderlineInput label="Rev. Cutting (per inch)" value={localSettings.constants.REVERSE_CUTTING_PER_INCH} onChange={v => updateConstant('REVERSE_CUTTING_PER_INCH', v)} />
                    <UnderlineInput label="LED Cost (₹)" value={localSettings.constants.LED_COST} onChange={v => updateConstant('LED_COST', v)} />
                </div>

                <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, marginBottom: 16, color: C.fg }}>Frame Rates (per ft)</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 40 }}>
                    {localSettings.frames.map(f => (
                        <UnderlineInput key={f.weight} label={`${f.label} Frame Rate`} value={f.rate} onChange={v => updateFrameRate(f.weight, v)} />
                    ))}
                </div>

                <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, marginBottom: 16, color: C.fg }}>Material Rates</h3>
                {Object.entries(localSettings.materials).map(([catKey, cat]) => (
                    <div key={catKey} style={{ marginBottom: 24 }}>
                        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500, color: C.mutedFg, marginBottom: 16 }}>{cat.label} ({cat.unit})</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                            {cat.items.map(item => (
                                <UnderlineInput key={item.id} label={item.name} value={item.rate} onChange={v => updateMaterialRate(catKey, item.id, v)} />
                            ))}
                        </div>
                    </div>
                ))}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginTop: 40 }}>
                    <button onClick={onClose} style={{ padding: "12px 24px", border: `1px solid ${C.borderStrong}`, background: "transparent", cursor: "pointer", color: C.fg }}>Cancel</button>
                    <button onClick={handleSave} style={{ padding: "12px 24px", background: C.orange, color: "#fff", border: "none", cursor: "pointer" }}>Save Changes</button>
                </div>
            </div>
        </div>
    );
}

// ─── MAIN ────────────────────────────────────────────────────────
export default function LeRoyFlexCosting() {
    const [category, setCategory] = useState("flexes");
    const [material, setMaterial] = useState("flex200");
    const [length, setLength] = useState(0);
    const [breadth, setBreadth] = useState(0);
    const [runningInch, setRunningInch] = useState(0);
    const [reverseCutting, setReverseCutting] = useState(false);
    const [reverseCuttingInch, setReverseCuttingInch] = useState(0);
    const [needsFrame, setNeedsFrame] = useState(false);
    const [frameType, setFrameType] = useState("2");
    const [needsTransport, setNeedsTransport] = useState(false);
    const [distance, setDistance] = useState(0);
    const [needsInstallation, setNeedsInstallation] = useState(false);
    const [qty, setQty] = useState(1);
    const [showSettings, setShowSettings] = useState(false);
    const [dimUnit, setDimUnit] = useState("ft");
    const [needsLEDs, setNeedsLEDs] = useState(false);

    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem("lrpp_settings");
            if (saved) return JSON.parse(saved);
        } catch (e) { }
        return {
            materials: DEFAULT_MATERIAL_CATEGORIES,
            frames: DEFAULT_FRAME_RATES,
            constants: DEFAULT_CONSTANTS
        };
    });

    const MATERIAL_CATEGORIES = settings.materials;
    const FRAME_RATES = settings.frames;
    const { TRANSPORT_RATE, INSTALLATION_RATE, WELDING_PER_SUPPORT, REVERSE_CUTTING_BASE, REVERSE_CUTTING_PER_INCH, SUPPORT_EVERY_FT, LED_COST } = settings.constants;

    const handleSaveSettings = (newSettings) => {
        setSettings(newSettings);
        localStorage.setItem("lrpp_settings", JSON.stringify(newSettings));
    };

    const catData = MATERIAL_CATEGORIES[category];
    const isLetterBoard = !!catData?.isLetterBoard;
    const isAcrylic = !!catData?.isAcrylic;
    const hasSubcategory = !!catData?.hasSubcategory;
    const currentMaterials = catData?.items || [];
    const selectedMaterial = currentMaterials.find((m) => m.id === material);
    const rate = selectedMaterial?.rate || 0;
    const categoryLabel = catData?.label || "";

    const handleCategoryChange = useCallback((val) => {
        setCategory(val);
        const items = MATERIAL_CATEGORIES[val]?.items || [];
        setMaterial(items[0]?.id || "");
    }, []);

    const handleReset = () => {
        setLength(0); setBreadth(0); setRunningInch(0);
        setReverseCutting(false); setReverseCuttingInch(0);
        setNeedsFrame(false); setFrameType("2");
        setNeedsTransport(false); setDistance(0);
        setNeedsInstallation(false); setQty(1);
        setDimUnit("ft"); setNeedsLEDs(false);
    };

    const costs = useMemo(() => {
        const r = { materialCost: 0, effectiveWidth: 0, effectiveArea: 0, reverseCuttingCost: 0, frameCost: 0, supportCount: 0, supportMaterialCost: 0, supportLength: 0, weldingCost: 0, transportCost: 0, installationCost: 0, perimeter: 0, ledCount: 0, ledCost: 0, subtotal: 0, total: 0 };
        
        const lFt = dimUnit === "in" ? length / 12 : length;
        const wFt = dimUnit === "in" ? breadth / 12 : breadth;

        if (isLetterBoard) {
            r.materialCost = runningInch * rate;
            if (reverseCutting) r.reverseCuttingCost = REVERSE_CUTTING_BASE + (reverseCuttingInch * REVERSE_CUTTING_PER_INCH);
        } else {
            const effW = getEffectiveRollWidth(wFt);
            r.effectiveWidth = effW;
            if (isAcrylic) {
                r.effectiveArea = lFt * 12 * wFt * 12;
                r.materialCost = r.effectiveArea * rate;
            } else {
                if (dimUnit === "in") {
                    const lIn = length;
                    const effWIn = effW * 12;
                    const areaInSqInches = lIn * effWIn;
                    r.effectiveArea = areaInSqInches / 144;
                } else {
                    r.effectiveArea = lFt * effW;
                }
                r.materialCost = r.effectiveArea * rate;
            }
        }
        if (needsFrame && !isLetterBoard) {
            const w = isAcrylic ? wFt : (r.effectiveWidth || wFt);
            r.perimeter = 2 * (w + lFt);
            const fr = FRAME_RATES.find((f) => f.weight === parseInt(frameType));
            if (fr) r.frameCost = r.perimeter * fr.rate;
            if (material === "backlight") r.frameCost *= 2;
            // Supports calculation
            const heightFt = Math.max(lFt, w);
            const rawCount = Math.floor(heightFt / 5);
            r.supportCount = heightFt >= 10 ? Math.max(0, rawCount - 1) : Math.max(0, rawCount);
            // Each support rod runs across the width — its length = width of sign
            r.supportLength = Math.min(lFt, w); // shorter dimension = width the rod spans
            if (fr) r.supportMaterialCost = r.supportCount * r.supportLength * fr.rate;
            r.weldingCost = (r.supportCount * 2 + 4) * WELDING_PER_SUPPORT;
        }
        if (material === "backlight" && needsLEDs) {
            const maxFt = Math.max(lFt, wFt);
            const minFt = Math.min(lFt, wFt);
            const ledsLength = Math.ceil((maxFt * 12) / 40);
            const ledsWidth = Math.ceil(minFt / 2);
            r.ledCount = ledsLength * ledsWidth;
            r.ledCost = r.ledCount * LED_COST;
        }
        if (needsTransport) r.transportCost = distance * TRANSPORT_RATE;
        if (needsInstallation && !isLetterBoard) {
            const area = isAcrylic ? (lFt * wFt) : (lFt * (r.effectiveWidth || wFt));
            r.installationCost = area * INSTALLATION_RATE;
        }
        r.subtotal = r.materialCost + r.reverseCuttingCost + r.frameCost + r.supportMaterialCost + r.weldingCost + r.ledCost + r.transportCost + r.installationCost;
        r.total = r.subtotal * Math.max(qty, 1);
        return r;
    }, [category, material, rate, length, breadth, runningInch, reverseCutting, reverseCuttingInch, needsFrame, frameType, needsTransport, distance, needsInstallation, isLetterBoard, isAcrylic, qty, dimUnit, needsLEDs, LED_COST, FRAME_RATES, REVERSE_CUTTING_BASE, REVERSE_CUTTING_PER_INCH, TRANSPORT_RATE, INSTALLATION_RATE, WELDING_PER_SUPPORT]);

    const costItems = [];
    const matLabel = hasSubcategory ? `${categoryLabel} — ${selectedMaterial?.name}` : categoryLabel;
    costItems.push({ label: matLabel || "Material", detail: !isLetterBoard && !isAcrylic && costs.effectiveArea > 0 ? `${costs.effectiveArea.toFixed(2)} sq ft × ₹${rate}` : isLetterBoard && runningInch > 0 ? `${runningInch} inch × ₹${rate}` : isAcrylic && costs.effectiveArea > 0 ? `${costs.effectiveArea.toLocaleString()} sq in × ₹${rate}` : null, value: costs.materialCost });
    if (reverseCutting && costs.reverseCuttingCost > 0) costItems.push({ label: "Reverse Cutting", detail: `₹${REVERSE_CUTTING_BASE} + ${reverseCuttingInch}″ × ₹${REVERSE_CUTTING_PER_INCH}`, value: costs.reverseCuttingCost });
    if (needsFrame && costs.frameCost > 0) costItems.push({ label: "Frame (Perimeter)", detail: `${costs.perimeter.toFixed(1)}ft × ₹${FRAME_RATES.find(f => f.weight === parseInt(frameType))?.rate}/ft${material === "backlight" ? " (Doubled)" : ""}`, value: costs.frameCost });
    if (needsFrame && costs.supportMaterialCost > 0) costItems.push({ label: "Support Rods (Material)", detail: `${costs.supportCount} rods × ${costs.supportLength.toFixed(1)}ft × ₹${FRAME_RATES.find(f => f.weight === parseInt(frameType))?.rate}/ft`, value: costs.supportMaterialCost });
    if (needsFrame && costs.weldingCost > 0) costItems.push({ label: "Support Welding", detail: `${(costs.supportCount * 2 + 4)} joints × ₹${WELDING_PER_SUPPORT}`, value: costs.weldingCost });
    if (material === "backlight" && costs.ledCost > 0) costItems.push({ label: "LED Modules", detail: `${costs.ledCount} LEDs × ₹${LED_COST}`, value: costs.ledCost });
    if (needsInstallation && costs.installationCost > 0) costItems.push({ label: "Installation", value: costs.installationCost });
    if (needsTransport && costs.transportCost > 0) costItems.push({ label: "Transportation", detail: `${distance} km × ₹${TRANSPORT_RATE}`, value: costs.transportCost });

    return (
        <div style={{ minHeight: "100vh", background: C.bg, position: "relative", overflow: "hidden" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button{-webkit-appearance:none}
        input[type="number"]{-moz-appearance:textfield}
        ::selection{background:rgba(224,123,48,0.15)}
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp .7s cubic-bezier(.25,.46,.45,.94) both}
        .fu1{animation-delay:.08s}.fu2{animation-delay:.16s}.fu3{animation-delay:.24s}
        .fu4{animation-delay:.32s}.fu5{animation-delay:.4s}
        .roll-chip{transition:all 500ms ease-out;cursor:default}
        .roll-chip:hover{background:${C.blue}!important;color:#fff!important}
      `}</style>

            {/* Noise */}
            <div style={{ position: "fixed", inset: 0, zIndex: 50, pointerEvents: "none", opacity: 0.02 }}>
                <svg width="100%" height="100%"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="4" stitchTiles="stitch" /></filter><rect width="100%" height="100%" filter="url(#n)" /></svg>
            </div>

            {/* Grid lines */}
            {[25, 50, 75].map((p) => (
                <div key={p} style={{ position: "fixed", top: 0, bottom: 0, left: `${p}%`, width: 1, background: "rgba(26,26,26,0.04)", zIndex: 1, pointerEvents: "none" }} />
            ))}

            {/* HEADER */}
            <header style={{
                borderBottom: `1px solid ${C.border}`, padding: "20px 40px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                position: "sticky", top: 0, zIndex: 40,
                background: `${C.bg}F2`, backdropFilter: "blur(12px)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <img src={LOGO_SRC} alt="LeRoy Print Packs" style={{ height: 40, width: "auto", objectFit: "contain" }} />
                    <div style={{ width: 1, height: 24, background: C.borderStrong }} />
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: C.mutedFg }}>
                        Flex Dept. Costing
                    </span>
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                    <button onClick={() => setShowSettings(true)} style={{
                        height: 40, padding: "0 24px", border: `1px solid ${C.borderStrong}`, background: "transparent",
                        fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 500,
                        letterSpacing: "0.2em", textTransform: "uppercase", color: C.fg,
                        cursor: "pointer", transition: "all 500ms ease-out",
                    }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = C.muted; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >Edit Rates</button>
                    <button onClick={handleReset} style={{
                        height: 40, padding: "0 24px", border: `1px solid ${C.fg}`, background: "transparent",
                        fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 500,
                        letterSpacing: "0.2em", textTransform: "uppercase", color: C.fg,
                        cursor: "pointer", transition: "all 500ms ease-out", position: "relative", overflow: "hidden",
                    }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = C.fg; e.currentTarget.style.color = C.bg; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.fg; }}
                    >Clear All</button>
                </div>
            </header>

            <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} settings={settings} onSave={handleSaveSettings} />

            {/* HERO */}
            <section className="fu" style={{ padding: "64px 40px 0", maxWidth: 1600, margin: "0 auto" }}>
                <Overline>Flex Department / Costing Tool</Overline>
                <h1 style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)", fontWeight: 400,
                    color: C.fg, lineHeight: 0.95, letterSpacing: "-0.02em", maxWidth: 700,
                }}>
                    Signage{" "}<em style={{ color: C.orange, fontStyle: "italic" }}>Cost</em><br />Estimator
                </h1>
                <p style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 15, color: C.mutedFg,
                    marginTop: 20, maxWidth: 440, lineHeight: 1.7,
                }}>
                    Calculate material, fabrication, and service costs for flex printing, signage boards, and 3D letter boards.
                </p>
            </section>

            {/* MAIN */}
            <main className="main-grid" style={{
                maxWidth: 1600, margin: "0 auto", padding: "48px 40px 120px",
                display: "grid", gridTemplateColumns: "1fr 0.72fr", gap: 64, alignItems: "start",
            }}>

                {/* LEFT */}
                <div>
                    {/* 01 Material */}
                    <div className="fu fu1" style={{ borderTop: `1px solid ${C.fg}`, paddingTop: 32, marginBottom: 48 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 28 }}>
                            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 36, fontWeight: 400, color: C.muted, lineHeight: 0.9 }}>01</span>
                            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 400, color: C.fg }}>
                                Material <em style={{ fontStyle: "italic", color: C.orange }}>Selection</em>
                            </h2>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                            <UnderlineSelect label="Material Category" value={category} onChange={handleCategoryChange}
                                options={Object.entries(MATERIAL_CATEGORIES).map(([k, v]) => ({ value: k, label: v.label }))} />
                            {hasSubcategory && (
                                <UnderlineSelect label={catData.subcategoryLabel} value={material} onChange={setMaterial}
                                    options={currentMaterials.map((m) => ({ value: m.id, label: m.name }))} />
                            )}
                        </div>

                    </div>

                    {/* 02 Dimensions */}
                    <div className="fu fu2" style={{ borderTop: `1px solid ${C.fg}`, paddingTop: 32, marginBottom: 48 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 28 }}>
                            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 36, fontWeight: 400, color: C.muted, lineHeight: 0.9 }}>02</span>
                            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 400, color: C.fg }}>Dimensions</h2>
                            {!isLetterBoard && (
                                <div style={{ marginLeft: "auto", display: "flex", background: C.muted, borderRadius: 20, padding: 4 }}>
                                    <div onClick={() => setDimUnit("ft")} style={{ padding: "4px 12px", borderRadius: 16, background: dimUnit === "ft" ? "#fff" : "transparent", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 500, color: C.fg, boxShadow: dimUnit === "ft" ? "0 2px 4px rgba(0,0,0,0.05)" : "none", transition: "all 0.2s" }}>ft</div>
                                    <div onClick={() => setDimUnit("in")} style={{ padding: "4px 12px", borderRadius: 16, background: dimUnit === "in" ? "#fff" : "transparent", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 500, color: C.fg, boxShadow: dimUnit === "in" ? "0 2px 4px rgba(0,0,0,0.05)" : "none", transition: "all 0.2s" }}>in</div>
                                </div>
                            )}
                        </div>
                        {isLetterBoard ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                                <UnderlineInput label="Running Inches" value={runningInch || ""} onChange={setRunningInch} suffix="inch" />
                                <ToggleSwitch label="Reverse Cutting" sublabel={`₹${REVERSE_CUTTING_BASE} base + ₹${REVERSE_CUTTING_PER_INCH}/inch`} checked={reverseCutting} onChange={setReverseCutting} />
                                {reverseCutting && <UnderlineInput label="Reverse Cutting Inches" value={reverseCuttingInch || ""} onChange={setReverseCuttingInch} suffix="inch" />}
                            </div>
                        ) : (
                            <>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                                    <UnderlineInput label="Length" value={length || ""} onChange={setLength} suffix={dimUnit} step={0.5} />
                                    <UnderlineInput label="Width / Breadth" value={breadth || ""} onChange={setBreadth} suffix={dimUnit} step={0.5} />
                                </div>
                                {!isAcrylic && breadth > 0 && (
                                    <div style={{ marginTop: 20, padding: "14px 0", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{ width: 6, height: 6, background: (dimUnit === "in" ? breadth / 12 : breadth) !== costs.effectiveWidth ? C.orange : C.blue }} />
                                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: C.mutedFg }}>
                                            {(dimUnit === "in" ? breadth / 12 : breadth) !== costs.effectiveWidth
                                                ? <>Width {(dimUnit === "in" ? breadth / 12 : breadth).toFixed(2)}ft → billed at <strong style={{ color: C.fg }}>{costs.effectiveWidth}ft</strong> (next roll)</>
                                                : <>Width matches standard {costs.effectiveWidth}ft roll</>}
                                        </span>
                                    </div>
                                )}
                                {isAcrylic && breadth > 0 && length > 0 && (
                                    <div style={{ marginTop: 20, padding: "14px 0", borderBottom: `1px solid ${C.border}` }}>
                                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: C.mutedFg }}>
                                            Acrylic area: {(length * 12 * breadth * 12).toLocaleString()} sq inches
                                        </span>
                                    </div>
                                )}
                                {!isAcrylic && (
                                    <div style={{ marginTop: 24 }}>
                                        <FieldLabel>Available Roll Widths</FieldLabel>
                                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                            {ROLL_SIZES.map((s) => (
                                                <div key={s} className="roll-chip" style={{
                                                    padding: "8px 16px",
                                                    border: `1px solid ${costs.effectiveWidth === s ? C.blue : C.borderStrong}`,
                                                    background: costs.effectiveWidth === s ? C.blue : "transparent",
                                                    color: costs.effectiveWidth === s ? "#fff" : C.mutedFg,
                                                    fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                                                }}>{s}ft</div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* 03 Quantity */}
                    <div className="fu fu3" style={{ borderTop: `1px solid ${C.fg}`, paddingTop: 32, marginBottom: 48 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 28 }}>
                            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 36, fontWeight: 400, color: C.muted, lineHeight: 0.9 }}>03</span>
                            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 400, color: C.fg }}>Quantity</h2>
                        </div>
                        <div style={{ maxWidth: 200 }}>
                            <UnderlineInput label="Units" value={qty || ""} onChange={setQty} step={1} />
                        </div>
                    </div>

                    {/* 04 Services */}
                    <div className="fu fu4" style={{ borderTop: `1px solid ${C.fg}`, paddingTop: 32 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 28 }}>
                            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 36, fontWeight: 400, color: C.muted, lineHeight: 0.9 }}>04</span>
                            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 400, color: C.fg }}>
                                Additional <em style={{ fontStyle: "italic", color: C.orange }}>Services</em>
                            </h2>
                        </div>
                        {!isLetterBoard && (
                            <>
                                {material === "backlight" && (
                                    <ToggleSwitch label="Add LEDs (Backlight)" sublabel={`₹${LED_COST} per LED module (40" length × 2' width)`} checked={needsLEDs} onChange={setNeedsLEDs} />
                                )}
                                <ToggleSwitch label="Frame & Supports" sublabel={`Perimeter frame + support rods + welding ${material === "backlight" ? "(Cost Doubled for Backlight)" : ""}`} checked={needsFrame} onChange={setNeedsFrame} />
                                {needsFrame && (
                                    <div style={{ paddingLeft: 56, paddingTop: 16, paddingBottom: 16 }}>
                                        <UnderlineSelect label="Frame Weight" value={frameType} onChange={setFrameType}
                                            options={FRAME_RATES.map((f) => ({ value: String(f.weight), label: `${f.label} — ₹${f.rate}/ft` }))} />
                                        <div style={{ marginTop: 16, fontFamily: "'Inter', sans-serif", fontSize: 12, color: C.mutedFg, lineHeight: 2 }}>
                                            Frame perimeter: {costs.perimeter.toFixed(1)}ft → {formatINR(costs.frameCost)}<br />
                                            Supports: {costs.supportCount} rod{costs.supportCount !== 1 ? "s" : ""} × {costs.supportLength.toFixed(1)}ft each → Material: {formatINR(costs.supportMaterialCost)}<br />
                                            Welding: {costs.supportCount} joint{costs.supportCount !== 1 ? "s" : ""} × ₹{WELDING_PER_SUPPORT} → {formatINR(costs.weldingCost)}
                                        </div>
                                    </div>
                                )}
                                <ToggleSwitch label="Installation" sublabel={`₹${INSTALLATION_RATE} per sq ft`} checked={needsInstallation} onChange={setNeedsInstallation} />
                            </>
                        )}
                        <ToggleSwitch label="Transportation" sublabel={`₹${TRANSPORT_RATE} per km`} checked={needsTransport} onChange={setNeedsTransport} />
                        {needsTransport && (
                            <div style={{ paddingLeft: 56, paddingTop: 12, paddingBottom: 16, maxWidth: 240 }}>
                                <UnderlineInput label="Distance" value={distance || ""} onChange={setDistance} suffix="km" />
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: COST BREAKDOWN */}
                <div className="fu fu5" style={{ position: "sticky", top: 100 }}>
                    {/* Vertical side label */}
                    <div style={{
                        position: "absolute", left: -36, top: 0,
                        writingMode: "vertical-rl", transform: "rotate(180deg)",
                        fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 500,
                        letterSpacing: "0.25em", textTransform: "uppercase", color: C.muted,
                        display: "var(--show-vlabel, block)",
                    }}>Estimate / Live</div>

                    {/* Dark panel */}
                    <div style={{
                        background: C.fg, padding: "40px 36px",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                        position: "relative", overflow: "hidden",
                    }}>
                        {/* Dot texture */}
                        <div style={{
                            position: "absolute", inset: 0, opacity: 0.03, pointerEvents: "none",
                            backgroundImage: "radial-gradient(circle, #fff 0.5px, transparent 0.5px)",
                            backgroundSize: "20px 20px",
                        }} />
                        {/* Orange accent bar */}
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(to right, ${C.orange}, ${C.orangeLight})` }} />

                        <div style={{ position: "relative" }}>
                            <Overline light>Cost Breakdown</Overline>

                            <div style={{ marginTop: 8 }}>
                                {costItems.map((item, i) => (
                                    <div key={i} style={{
                                        display: "flex", justifyContent: "space-between", alignItems: "baseline",
                                        padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.08)",
                                    }}>
                                        <div>
                                            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{item.label}</div>
                                            {item.detail && <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{item.detail}</div>}
                                        </div>
                                        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, color: "#fff" }}>{formatINR(item.value)}</div>
                                    </div>
                                ))}

                                {costItems.length === 0 && (
                                    <div style={{ padding: "32px 0", textAlign: "center" }}>
                                        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontStyle: "italic", color: "rgba(255,255,255,0.25)" }}>
                                            Enter dimensions to begin
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Subtotal */}
                            <div style={{
                                marginTop: 20, paddingTop: 20,
                                borderTop: "1px solid rgba(255,255,255,0.15)",
                                display: "flex", justifyContent: "space-between", alignItems: "baseline",
                            }}>
                                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>Per Unit</span>
                                <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: "rgba(255,255,255,0.85)" }}>{formatINR(costs.subtotal)}</span>
                            </div>
                            {qty > 1 && (
                                <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>× {qty} units</span>
                                </div>
                            )}

                            {/* Grand Total */}
                            <div style={{ marginTop: 28, paddingTop: 28, borderTop: `2px solid ${C.orange}` }}>
                                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: C.orange, marginBottom: 8 }}>Grand Total</div>
                                <div style={{
                                    fontFamily: "'Playfair Display', Georgia, serif",
                                    fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 400,
                                    color: "#fff", lineHeight: 1, letterSpacing: "-0.02em",
                                }}>{formatINR(costs.total)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Formula */}
                    <div style={{ marginTop: 24, padding: "20px 0", borderTop: `1px solid ${C.border}` }}>
                        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.mutedFg, marginBottom: 12 }}>Formula</div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: C.fg, lineHeight: 2.2 }}>
                            {isLetterBoard ? <>Inches × Rate + Extras</> : isAcrylic ? <>(L×12) × (B×12) × Rate</> : <>L × B<sub style={{ fontSize: 10 }}>eff</sub> × Rate</>}
                            <br /><span style={{ color: C.mutedFg }}>+ Frame + Welding + Install + Transport</span>
                        </div>
                    </div>

                    {/* Contact */}
                    <div style={{ marginTop: 16, padding: "20px 0", borderTop: `1px solid ${C.border}` }}>
                        <img src={LOGO_SRC} alt="LeRoy Print Packs" style={{ height: 32, width: "auto", objectFit: "contain", marginBottom: 14, opacity: 0.6, filter: "grayscale(0.3)" }} />
                        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.mutedFg, marginBottom: 8 }}>Questions?</div>
                        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: C.fg, lineHeight: 1.8 }}>
                            +91 92166-12100<br /><span style={{ color: C.mutedFg }}>leroyprint@gmail.com</span>
                        </div>
                    </div>
                </div>
            </main>

            <style>{`
        @media(max-width:900px){
          .main-grid{grid-template-columns:1fr!important;gap:40px!important;padding:32px 20px 80px!important}
          header{padding:16px 20px!important}
          section{padding:40px 20px 0!important}
        }
      `}</style>
        </div>
    );
}
