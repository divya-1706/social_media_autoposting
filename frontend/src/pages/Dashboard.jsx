import axios from "axios";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

/* ─── Deep Space AI Background ─────────────────────────────────── */
function DeepSpaceBackground({ mousePos }) {
    const canvasRef = useRef(null);

    /* ── Starfield Canvas ─────────────────────────── */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let animId;

        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        resize();
        window.addEventListener("resize", resize);

        // Create layered stars with depth
        const stars = [];
        for (let i = 0; i < 120; i++) {
            const depth = Math.random(); // 0 = far, 1 = near
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: depth * 1.8 + 0.3,
                baseOpacity: depth * 0.5 + 0.1,
                twinkleSpeed: Math.random() * 0.02 + 0.005,
                twinkleOffset: Math.random() * Math.PI * 2,
                speedX: (Math.random() - 0.5) * 0.08 * (1 - depth * 0.5),
                speedY: (Math.random() - 0.5) * 0.06 * (1 - depth * 0.5),
                hue: [210, 230, 260, 200, 180][Math.floor(Math.random() * 5)],
                depth,
            });
        }

        const drawConstellations = () => {
            for (let i = 0; i < stars.length; i++) {
                if (stars[i].depth < 0.4) continue; // Only bright stars
                for (let j = i + 1; j < stars.length; j++) {
                    if (stars[j].depth < 0.4) continue;
                    const dx = stars[i].x - stars[j].x;
                    const dy = stars[i].y - stars[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 100) {
                        const alpha = 0.035 * (1 - dist / 100);
                        ctx.strokeStyle = `rgba(79, 172, 254, ${alpha})`;
                        ctx.lineWidth = 0.4;
                        ctx.beginPath();
                        ctx.moveTo(stars[i].x, stars[i].y);
                        ctx.lineTo(stars[j].x, stars[j].y);
                        ctx.stroke();
                    }
                }
            }
        };

        let time = 0;
        const loop = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            time += 0.016;

            stars.forEach(s => {
                s.x += s.speedX;
                s.y += s.speedY;
                if (s.x < -5) s.x = canvas.width + 5;
                if (s.x > canvas.width + 5) s.x = -5;
                if (s.y < -5) s.y = canvas.height + 5;
                if (s.y > canvas.height + 5) s.y = -5;

                const twinkle = Math.sin(time * s.twinkleSpeed * 60 + s.twinkleOffset) * 0.3 + 0.7;
                const opacity = s.baseOpacity * twinkle;

                // Glow layer for bright stars
                if (s.depth > 0.6) {
                    ctx.beginPath();
                    ctx.arc(s.x, s.y, s.size * 4, 0, Math.PI * 2);
                    ctx.fillStyle = `hsla(${s.hue}, 70%, 70%, ${opacity * 0.08})`;
                    ctx.fill();
                }

                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${s.hue}, 60%, 80%, ${opacity})`;
                ctx.fill();
            });

            drawConstellations();
            animId = requestAnimationFrame(loop);
        };
        loop();
        return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
    }, []);

    /* ── Floating Mesh Shapes (SVG wireframes) ─── */
    const meshShapes = useMemo(() => [
        { // Hexagonal mesh — top right
            top: "8%", right: "5%", size: 220, opacity: 0.04, dur: "45s", delay: "0s",
            svg: (
                <svg viewBox="0 0 200 200" fill="none" stroke="rgba(79,172,254,0.5)" strokeWidth="0.5">
                    <polygon points="100,10 170,50 170,130 100,170 30,130 30,50" />
                    <polygon points="100,30 150,55 150,120 100,145 50,120 50,55" />
                    <line x1="100" y1="10" x2="100" y2="30" /><line x1="170" y1="50" x2="150" y2="55" />
                    <line x1="170" y1="130" x2="150" y2="120" /><line x1="100" y1="170" x2="100" y2="145" />
                    <line x1="30" y1="130" x2="50" y2="120" /><line x1="30" y1="50" x2="50" y2="55" />
                </svg>
            ),
        },
        { // Diamond lattice — bottom left
            bottom: "12%", left: "3%", size: 180, opacity: 0.035, dur: "55s", delay: "3s",
            svg: (
                <svg viewBox="0 0 200 200" fill="none" stroke="rgba(168,85,247,0.5)" strokeWidth="0.5">
                    <polygon points="100,5 195,100 100,195 5,100" />
                    <polygon points="100,40 160,100 100,160 40,100" />
                    <polygon points="100,70 130,100 100,130 70,100" />
                    <line x1="100" y1="5" x2="100" y2="195" /><line x1="5" y1="100" x2="195" y2="100" />
                </svg>
            ),
        },
        { // Triangle grid — mid left
            top: "45%", left: "8%", size: 140, opacity: 0.03, dur: "50s", delay: "6s",
            svg: (
                <svg viewBox="0 0 200 200" fill="none" stroke="rgba(0,242,254,0.45)" strokeWidth="0.5">
                    <polygon points="100,10 190,170 10,170" />
                    <polygon points="100,50 160,150 40,150" />
                    <line x1="100" y1="10" x2="100" y2="170" />
                    <line x1="55" y1="90" x2="190" y2="170" /><line x1="145" y1="90" x2="10" y2="170" />
                </svg>
            ),
        },
        { // Circle mesh — bottom right
            bottom: "25%", right: "8%", size: 160, opacity: 0.03, dur: "60s", delay: "8s",
            svg: (
                <svg viewBox="0 0 200 200" fill="none" stroke="rgba(240,147,251,0.4)" strokeWidth="0.5">
                    <circle cx="100" cy="100" r="90" /><circle cx="100" cy="100" r="60" />
                    <circle cx="100" cy="100" r="30" />
                    <line x1="100" y1="10" x2="100" y2="190" /><line x1="10" y1="100" x2="190" y2="100" />
                    <line x1="36" y1="36" x2="164" y2="164" /><line x1="164" y1="36" x2="36" y2="164" />
                </svg>
            ),
        },
    ], []);

    /* ── Gradient Orbs (nebula clouds) ────────── */
    const orbs = useMemo(() => [
        { top: "-8%", right: "-8%", w: 550, h: 550, color1: "rgba(79,172,254,0.10)", color2: "rgba(79,172,254,0.02)", dur: "25s", delay: "0s" },
        { bottom: "-12%", left: "-6%", w: 500, h: 500, color1: "rgba(168,85,247,0.08)", color2: "rgba(168,85,247,0.01)", dur: "30s", delay: "2s" },
        { top: "25%", left: "35%", w: 400, h: 400, color1: "rgba(236,72,153,0.06)", color2: "rgba(236,72,153,0.01)", dur: "35s", delay: "5s" },
        { bottom: "15%", right: "12%", w: 420, h: 420, color1: "rgba(0,242,254,0.07)", color2: "rgba(0,242,254,0.01)", dur: "28s", delay: "1s" },
        { top: "60%", left: "10%", w: 350, h: 350, color1: "rgba(99,102,241,0.06)", color2: "rgba(99,102,241,0.01)", dur: "32s", delay: "4s" },
    ], []);

    return (
        <>
            {/* Layer 0: Deep space gradient base */}
            <div style={{
                position: "fixed", inset: 0, zIndex: 0,
                background: "radial-gradient(ellipse at 20% 20%, rgba(15,23,42,1) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(30,15,50,0.6) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(4,11,20,1) 0%, #040b14 100%)",
            }} />

            {/* Layer 1: Starfield canvas */}
            <canvas ref={canvasRef} id="particle-canvas" />

            {/* Layer 2: Nebula gradient orbs */}
            {orbs.map((o, i) => (
                <div key={`orb-${i}`} style={{
                    position: "fixed", width: o.w, height: o.h, borderRadius: "50%", zIndex: 0,
                    background: `radial-gradient(circle, ${o.color1} 0%, ${o.color2} 50%, transparent 70%)`,
                    filter: "blur(60px)",
                    animation: `orbPulse ${o.dur} ease-in-out infinite ${o.delay}`,
                    top: o.top, bottom: o.bottom, left: o.left, right: o.right,
                    transform: `translate(${mousePos.x * (6 + i * 3)}px, ${mousePos.y * (6 + i * 3)}px)`,
                    transition: "transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                    pointerEvents: "none",
                }} />
            ))}

            {/* Layer 3: Floating mesh shapes */}
            {meshShapes.map((m, i) => (
                <div key={`mesh-${i}`} style={{
                    position: "fixed", width: m.size, height: m.size, zIndex: 0,
                    top: m.top, bottom: m.bottom, left: m.left, right: m.right,
                    opacity: m.opacity,
                    animation: `meshRotate ${m.dur} linear infinite ${m.delay}`,
                    transform: `translate(${mousePos.x * (3 + i * 2)}px, ${mousePos.y * (3 + i * 2)}px)`,
                    transition: "transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                    pointerEvents: "none",
                }}>
                    {m.svg}
                </div>
            ))}

            {/* Layer 4: Animated light beams */}
            <div style={{
                position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden",
            }}>
                <div style={{
                    position: "absolute", top: "-50%", left: "-50%", width: "200%", height: "200%",
                    background: "linear-gradient(25deg, transparent 40%, rgba(79,172,254,0.04) 45%, rgba(79,172,254,0.08) 50%, rgba(79,172,254,0.04) 55%, transparent 60%)",
                    animation: "lightBeamSweep 18s linear infinite",
                }} />
                <div style={{
                    position: "absolute", top: "-50%", left: "-50%", width: "200%", height: "200%",
                    background: "linear-gradient(-15deg, transparent 40%, rgba(168,85,247,0.03) 45%, rgba(168,85,247,0.06) 50%, rgba(168,85,247,0.03) 55%, transparent 60%)",
                    animation: "lightBeamSweep2 24s linear infinite 6s",
                }} />
            </div>

            {/* Layer 5: Subtle grid / scanline overlay */}
            <div style={{
                position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.015,
                backgroundImage: "linear-gradient(rgba(79,172,254,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(79,172,254,0.3) 1px, transparent 1px)",
                backgroundSize: "60px 60px",
            }} />

            {/* Layer 6: Depth vignette */}
            <div style={{
                position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
                background: "radial-gradient(ellipse at center, transparent 40%, rgba(4,11,20,0.5) 100%)",
            }} />
        </>
    );
}

/* ─── 3D Tilt Card Hook ───────────────────────────────────────── */
function useTilt(intensity = 8) {
    const ref = useRef(null);

    const handleMouseMove = useCallback((e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -intensity;
        const rotateY = ((x - centerX) / centerX) * intensity;
        el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
    }, [intensity]);

    const handleMouseLeave = useCallback(() => {
        const el = ref.current;
        if (el) el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)`;
    }, []);

    return { ref, onMouseMove: handleMouseMove, onMouseLeave: handleMouseLeave };
}

/* ─── Background Mesh Blobs ───────────────────────────────────── */
const meshBlobs = [
    { top: "-10%", right: "-10%", w: 600, h: 600, color: "rgba(0, 119, 181, 0.12)", blur: 80, dur: "15s", delay: "0s" },
    { bottom: "-15%", left: "-5%", w: 500, h: 500, color: "rgba(168, 85, 247, 0.10)", blur: 70, dur: "18s", delay: "2s" },
    { top: "30%", left: "40%", w: 400, h: 400, color: "rgba(236, 72, 153, 0.07)", blur: 90, dur: "20s", delay: "4s" },
    { bottom: "20%", right: "15%", w: 450, h: 450, color: "rgba(0, 242, 254, 0.08)", blur: 80, dur: "22s", delay: "1s" },
];

/* ─── Animation Variants ──────────────────────────────────────── */
const pageVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
};

const cardVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 18 } },
};

const statusVariants = {
    initial: { opacity: 0, y: -20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.95 },
};

/* ─── SVG Icons ─────────────────────────────────────────────── */
const LinkedInIcon = ({ size = 24, color = "#fff" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
);
const TwitterIcon = ({ size = 24, color = "#fff" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

/* ─── Status Color Map ────────────────────────────────────────── */
const statusThemes = {
    success: { bg: "rgba(0, 255, 136, 0.08)", border: "rgba(0, 255, 136, 0.25)", color: "#00ff88", glow: "0 0 20px rgba(0, 255, 136, 0.15)" },
    error: { bg: "rgba(245, 87, 108, 0.08)", border: "rgba(245, 87, 108, 0.25)", color: "#f5576c", glow: "0 0 20px rgba(245, 87, 108, 0.15)" },
    info: { bg: "rgba(79, 172, 254, 0.08)", border: "rgba(79, 172, 254, 0.25)", color: "#4facfe", glow: "0 0 20px rgba(79, 172, 254, 0.15)" },
};

/* ══════════════════════════════════════════════════════════════════
   DASHBOARD COMPONENT
══════════════════════════════════════════════════════════════════ */
function Dashboard() {
    const navigate = useNavigate();
    const [topic, setTopic] = useState("");
    const [tone, setTone] = useState("professional");
    const [length, setLength] = useState("medium");
    const [generatedText, setGeneratedText] = useState("");
    const [loading, setLoading] = useState(false);
    const [linkedinConnected, setLinkedinConnected] = useState(false);
    const [twitterConnected, setTwitterConnected] = useState(false);
    const [twitterScreenName, setTwitterScreenName] = useState("");
    const [statusMessage, setStatusMessage] = useState("");
    const [statusType, setStatusType] = useState("success");
    const [imagePrompt, setImagePrompt] = useState("");
    const [generatingImage, setGeneratingImage] = useState(false);
    const [selectedImages, setSelectedImages] = useState([]); // array of File
    const [imagePreviews, setImagePreviews] = useState([]); // array of preview URLs / base64
    const [posting, setPosting] = useState(false);
    const [charCount, setCharCount] = useState(0);
    const [postTo, setPostTo] = useState({ linkedin: true, twitter: false });
    const [scheduleEnabled, setScheduleEnabled] = useState(false);
    const [scheduleDate, setScheduleDate] = useState("");
    const [scheduleTime, setScheduleTime] = useState("");
    const [scheduleAmPm, setScheduleAmPm] = useState("AM");
    const fileInputRef = useRef(null);

    /* ─── Parallax Mouse ─────────────────────────────────── */
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    useEffect(() => {
        const handleMouseMove = (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 2;
            const y = (e.clientY / window.innerHeight - 0.5) * 2;
            setMousePos({ x, y });
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    /* ─── 3D Tilt hooks for cards ─────────────────────────── */
    const tiltHeader = useTilt(4);
    const tiltLI = useTilt(10);
    const tiltTW = useTilt(10);
    const tiltContent = useTilt(4);
    const tiltImage = useTilt(4);
    const tiltEditor = useTilt(4);

    /* ─── Auth + status ──────────────────────────────────── */
    const handleLogout = () => { localStorage.removeItem("token"); navigate("/login"); };

    useEffect(() => {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const params = new URLSearchParams(window.location.search);
        if (params.get("linkedin") === "success") { showStatus("✅ LinkedIn connected!", "success"); window.history.replaceState({}, "", "/dashboard"); }
        else if (params.get("linkedin") === "error") { showStatus("❌ LinkedIn: " + (params.get("message") || "Failed"), "error"); window.history.replaceState({}, "", "/dashboard"); }
        axios.get(`${API}/linkedin/status`, { headers })
            .then(res => setLinkedinConnected(Boolean(res.data?.connected)))
            .catch(() => setLinkedinConnected(false));
        axios.get(`${API}/twitter/status`, { headers })
            .then(res => { setTwitterConnected(Boolean(res.data?.connected)); if (res.data?.screen_name) setTwitterScreenName(res.data.screen_name); })
            .catch(() => setTwitterConnected(false));

    }, [navigate]);

    useEffect(() => { setCharCount(generatedText.length); }, [generatedText]);

    const showStatus = (msg, type = "success") => { setStatusMessage(msg); setStatusType(type); if (type !== "error") setTimeout(() => setStatusMessage(""), 3500); };

    /* ─── API Handlers (unchanged logic) ─────────────────── */
    const generateContent = async () => {
        if (!topic.trim()) { showStatus("⚠️ Enter a topic first!", "error"); return; }
        setLoading(true);
        const token = localStorage.getItem("token");
        try { const res = await axios.post(`${API}/content/generate`, { topic, tone, length }, { headers: { Authorization: `Bearer ${token}` } }); setGeneratedText(res.data.generated_text); showStatus("✨ Content generated!", "success"); }
        catch (err) { showStatus("❌ " + (err.response?.data?.detail || err.message), "error"); }
        setLoading(false);
    };
    const clearContent = () => { setGeneratedText(""); showStatus("🗑️ Cleared", "info"); };
    const loginLinkedIn = async () => { try { const token = localStorage.getItem("token"); const res = await axios.get(`${API}/linkedin/login`, { headers: { Authorization: `Bearer ${token}` } }); window.location.href = res.data.auth_url; } catch (err) { showStatus("❌ " + (err.response?.data?.detail || err.message), "error"); } };
    const disconnectLinkedIn = async () => { if (!window.confirm("Disconnect LinkedIn?")) return; try { const token = localStorage.getItem("token"); await axios.delete(`${API}/linkedin/disconnect`, { headers: { Authorization: `Bearer ${token}` } }); setLinkedinConnected(false); showStatus("🔓 LinkedIn disconnected", "info"); } catch (err) { showStatus("❌ " + (err.response?.data?.detail || err.message), "error"); } };
    const loginTwitter = async () => { try { const token = localStorage.getItem("token"); const res = await axios.get(`${API}/twitter/login`, { headers: { Authorization: `Bearer ${token}` } }); window.location.href = res.data.auth_url; } catch (err) { showStatus("❌ " + (err.response?.data?.detail || err.message), "error"); } };
    const disconnectTwitter = async () => { if (!window.confirm("Disconnect Twitter/X?")) return; try { const token = localStorage.getItem("token"); await axios.delete(`${API}/twitter/disconnect`, { headers: { Authorization: `Bearer ${token}` } }); setTwitterConnected(false); setTwitterScreenName(""); showStatus("🔓 Twitter disconnected", "info"); } catch (err) { showStatus("❌ " + (err.response?.data?.detail || err.message), "error"); } };
    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        const validFiles = [];
        const previews = [];
        for (const file of files) {
            if (!file.type.startsWith("image/")) { showStatus(`⚠️ Skipped non-image: ${file.name}`, "error"); continue; }
            if (file.size > 10 * 1024 * 1024) { showStatus(`⚠️ Skipped (>${10}MB): ${file.name}`, "error"); continue; }
            validFiles.push(file);
            previews.push(URL.createObjectURL(file));
        }
        if (validFiles.length === 0) return;
        setSelectedImages(prev => [...prev, ...validFiles]);
        setImagePreviews(prev => [...prev, ...previews]);
        showStatus("🖼️ Image(s) attached!", "success");
        // clear input so same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeImage = (index) => {
        setSelectedImages(prev => {
            const next = [...prev];
            next.splice(index, 1);
            return next;
        });
        setImagePreviews(prev => {
            if (!prev[index]) return prev;
            try { URL.revokeObjectURL(prev[index]); } catch (e) {}
            const next = [...prev];
            next.splice(index, 1);
            return next;
        });
    };

    const clearAllImages = () => {
        imagePreviews.forEach(p => { try { URL.revokeObjectURL(p); } catch (e) {} });
        setSelectedImages([]);
        setImagePreviews([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };
    const handleGenerateImage = async () => {
        if (!imagePrompt.trim()) { showStatus("⚠️ Enter an image prompt first!", "error"); return; }
        setGeneratingImage(true);
        const token = localStorage.getItem("token");
        try {
            const res = await axios.post(`${API}/content/generate-image`, { prompt: imagePrompt }, { headers: { Authorization: `Bearer ${token}` } });
            let base64Data = res.data.image_base64; let fileObj = null;
            if (base64Data) { const fetchRes = await fetch(base64Data); const blob = await fetchRes.blob(); fileObj = new File([blob], "generated_image.jpg", { type: "image/jpeg" }); }
            else if (res.data.image_url) { const imageRes = await fetch(res.data.image_url); const blob = await imageRes.blob(); fileObj = new File([blob], "generated_image.jpg", { type: "image/jpeg" }); base64Data = res.data.image_url; }
            // Append generated image to arrays
            if (fileObj) setSelectedImages(prev => [...prev, fileObj]);
            setImagePreviews(prev => [...prev, base64Data]);
            showStatus("🎨 Image generated!", "success");
        } catch (err) { showStatus("❌ " + (err.response?.data?.detail || err.message), "error"); }
        setGeneratingImage(false);
    };
    const postContent = async () => {
        if (!generatedText.trim()) { showStatus("⚠️ Write or generate content first!", "error"); return; }
        const targets = []; if (postTo.linkedin && linkedinConnected) targets.push("linkedin"); if (postTo.twitter && twitterConnected) targets.push("twitter");
        if (targets.length === 0) { showStatus("⚠️ Select at least one connected platform!", "error"); return; }
        setPosting(true); const results = [];
        const token = localStorage.getItem("token");
                for (const platform of targets) {
            try {
                const formData = new FormData();
                formData.append("text", generatedText);
                // append multiple images (backend expects 'images')
                if (selectedImages && selectedImages.length > 0) {
                    for (const file of selectedImages) {
                        formData.append("images", file);
                    }
                }
                if (scheduleEnabled && scheduleDate && scheduleTime) {
                    try {
                        // compose local Date from date + time + AM/PM
                        let [hh, mm] = scheduleTime.split(":");
                        hh = parseInt(hh, 10); mm = parseInt(mm, 10);
                        if (scheduleAmPm === "PM" && hh < 12) hh += 12;
                        if (scheduleAmPm === "AM" && hh === 12) hh = 0;
                        const parts = scheduleDate.split("-");
                        const y = parseInt(parts[0], 10), m = parseInt(parts[1], 10) - 1, d = parseInt(parts[2], 10);
                        const dt = new Date(y, m, d, hh, mm, 0);
                        formData.append("scheduled_time", dt.toISOString());
                    } catch (e) {
                        console.warn("Invalid scheduled time", e);
                    }
                }
                const res = await axios.post(`${API}/${platform}/post`, formData, { headers: { "Content-Type": "multipart/form-data", "Authorization": `Bearer ${token}` } });
                results.push(`✅ ${platform}: ${res.data.message}`);
            } catch (err) {
                results.push(`❌ ${platform}: ${err.response?.data?.detail || err.message}`);
            }
        }
                
                // attach scheduled time if requested
                // (add once per platform loop before sending)
                showStatus(results.join("  •  "), results.some(r => r.startsWith("❌")) ? "error" : "success");
        if (!results.some(r => r.startsWith("❌"))) clearAllImages();
        setPosting(false);
    };
    const copyToClipboard = () => { navigator.clipboard.writeText(generatedText); showStatus("📋 Copied!", "info"); };

    const anyConnected = linkedinConnected || twitterConnected;

    /* ═══════════════════════════════════════════════════════════
       RENDER
    ═══════════════════════════════════════════════════════════ */
    return (
        <div style={{ minHeight: "100vh", background: "#040b14", position: "relative", overflow: "hidden" }}>
            {/* ── Deep Space AI Background ──────────────── */}
            <DeepSpaceBackground mousePos={mousePos} />

            {/* ── Main Container ─────────────────────────── */}
            <motion.div
                variants={pageVariants} initial="hidden" animate="visible" exit="exit"
                style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px", fontFamily: "'Inter', sans-serif", position: "relative", zIndex: 1 }}
            >
                {/* ════ HEADER ═══════════════════════════════ */}
                <motion.div variants={cardVariants}
                    ref={tiltHeader.ref} onMouseMove={tiltHeader.onMouseMove} onMouseLeave={tiltHeader.onMouseLeave}
                    style={{
                        ...S.glassCard, borderRadius: 24, padding: 32, marginBottom: 24,
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        borderColor: "rgba(79, 172, 254, 0.12)",
                    }}
                >
                    {/* Glow accent */}
                    <div style={{ position: "absolute", top: -60, left: -60, width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(79, 172, 254, 0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", bottom: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 20, zIndex: 1 }}>
                        {/* ── 3D Floating Sphere Logo ──────────── */}
                        <motion.div
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            style={{ position: "relative", width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                        >
                            {/* Outer halo — soft purple */}
                            <div style={{
                                position: "absolute", inset: -16, borderRadius: "50%",
                                background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, rgba(168,85,247,0.04) 40%, transparent 70%)",
                                filter: "blur(10px)", animation: "pulseGlow 3s ease-in-out infinite",
                            }} />
                            {/* Mid sphere — blue glow */}
                            <div style={{
                                position: "absolute", inset: -6, borderRadius: "50%",
                                background: "radial-gradient(circle, rgba(79,172,254,0.18) 0%, rgba(79,172,254,0.06) 50%, transparent 75%)",
                                filter: "blur(6px)", animation: "pulseGlow 3s ease-in-out infinite 0.5s",
                            }} />
                            {/* Inner core ring */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                                style={{
                                    position: "absolute", inset: -2, borderRadius: "50%",
                                    background: "conic-gradient(from 0deg, rgba(79,172,254,0.25), transparent, rgba(168,85,247,0.2), transparent, rgba(0,242,254,0.15), transparent)",
                                    filter: "blur(2px)", opacity: 0.7,
                                }}
                            />
                            {/* Glass icon container */}
                            <div style={{
                                width: 64, height: 64, borderRadius: 16, position: "relative", zIndex: 2,
                                background: "linear-gradient(135deg, rgba(79,172,254,0.12), rgba(168,85,247,0.12))",
                                backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                border: "1px solid rgba(255,255,255,0.12)",
                                boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(79,172,254,0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
                            }}>
                                <svg width="38" height="38" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="64" height="64" rx="18" fill="url(#dash-logo-grad)" />
                                    <path d="M20 44V26C20 22.6863 22.6863 20 26 20H38C41.3137 20 44 22.6863 44 26V44" stroke="white" strokeWidth="4" strokeLinecap="round" />
                                    <path d="M20 32H44" stroke="white" strokeWidth="4" strokeLinecap="round" />
                                    <circle cx="44" cy="20" r="6" fill="#00F2FE" />
                                    <defs>
                                        <linearGradient id="dash-logo-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                                            <stop stopColor="#4FACFE" />
                                            <stop offset="1" stopColor="#00F2FE" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                        </motion.div>
                        <div>
                            <h1 style={{
                                fontSize: 30, fontWeight: 900, margin: 0, letterSpacing: "-1.5px",
                                background: "linear-gradient(135deg, #ffffff 0%, #4facfe 50%, #f093fb 100%)",
                                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                            }}>AI Social Hub</h1>
                            <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0", fontWeight: 400, letterSpacing: "0.5px" }}>Supercharge your professional presence</p>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", zIndex: 2 }}>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => navigate("/scheduled")} style={{
                                padding: "10px 18px", background: "linear-gradient(135deg, #4facfe, #7c3aed)", border: "none",
                                borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                                backdropFilter: "blur(8px)",
                            }}>📅 Scheduled</motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={handleLogout} style={{
                                padding: "10px 22px", background: "rgba(245, 87, 108, 0.08)", border: "1px solid rgba(245, 87, 108, 0.2)",
                                borderRadius: 12, color: "#f5576c", fontSize: 13, fontWeight: 700, cursor: "pointer",
                                backdropFilter: "blur(8px)",
                            }}>Logout</motion.button>
                    </div>
                </motion.div>

                {/* ════ STATUS BAR ════════════════════════════ */}
                <AnimatePresence>
                    {statusMessage && (
                        <motion.div variants={statusVariants} initial="initial" animate="animate" exit="exit"
                            style={{
                                padding: "12px 40px 12px 18px", borderRadius: 14,
                                border: `1px solid ${statusThemes[statusType].border}`,
                                background: statusThemes[statusType].bg, color: statusThemes[statusType].color,
                                boxShadow: statusThemes[statusType].glow,
                                fontSize: 13, marginBottom: 16, textAlign: "center", position: "relative",
                                backdropFilter: "blur(12px)",
                            }}>
                            {statusMessage}
                            <button onClick={() => setStatusMessage("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 14, padding: 4, opacity: 0.7 }}>✕</button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ════ STEPS INDICATOR ═══════════════════════ */}
                <motion.div variants={cardVariants} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 18 }}>
                    {[
                        { label: "Connect", done: anyConnected, active: !anyConnected },
                        { label: "Create", done: !!generatedText, active: anyConnected && !generatedText },
                        { label: "Post", done: false, active: !!(generatedText && anyConnected) },
                    ].map((step, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center" }}>
                            {i > 0 && <div style={{ width: 32, height: 1, background: step.done || step.active ? "rgba(79,172,254,0.3)" : "rgba(255,255,255,0.06)" }} />}
                            <motion.div whileHover={{ scale: 1.08 }} style={{
                                display: "flex", alignItems: "center", gap: 6, padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                                background: step.done ? "rgba(0,255,136,0.1)" : step.active ? "rgba(79,172,254,0.12)" : "rgba(255,255,255,0.03)",
                                color: step.done ? "#00ff88" : step.active ? "#4facfe" : "#4a5568",
                                border: `1px solid ${step.done ? "rgba(0,255,136,0.2)" : step.active ? "rgba(79,172,254,0.25)" : "rgba(255,255,255,0.06)"}`,
                                boxShadow: step.done ? "0 0 15px rgba(0,255,136,0.1)" : step.active ? "0 0 15px rgba(79,172,254,0.1)" : "none",
                            }}>
                                <span style={{ fontSize: 11, fontWeight: 800 }}>{step.done ? "✓" : i + 1}</span>
                                <span style={{ fontSize: 11 }}>{step.label}</span>
                            </motion.div>
                        </div>
                    ))}
                </motion.div>

                {/* ════ PLATFORM CARDS ════════════════════════ */}
                <motion.div variants={cardVariants} style={{ display: "flex", gap: 14, marginBottom: 18 }}>
                    {/* LinkedIn */}
                    <motion.div whileHover={{ y: -6 }}
                        ref={tiltLI.ref} onMouseMove={tiltLI.onMouseMove} onMouseLeave={tiltLI.onMouseLeave}
                        style={{
                            ...S.glassCard, flex: 1, borderRadius: 18, padding: "18px 20px",
                            borderColor: linkedinConnected ? "rgba(0,119,181,0.3)" : "rgba(255,255,255,0.06)",
                            boxShadow: linkedinConnected ? "0 10px 40px rgba(0,119,181,0.12), inset 0 1px 0 rgba(255,255,255,0.08)" : S.glassCard.boxShadow,
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #0077B5, #005f8f)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,119,181,0.3)" }}>
                                <LinkedInIcon size={15} color="#fff" />
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", flex: 1 }}>LinkedIn</span>
                            <div style={{
                                width: 10, height: 10, borderRadius: "50%",
                                background: linkedinConnected ? "#00ff88" : "#334155",
                                boxShadow: linkedinConnected ? "0 0 12px rgba(0,255,136,0.6)" : "none",
                            }} />
                        </div>
                        {linkedinConnected ? (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 12, color: "#00ff88", fontWeight: 600 }}>✓ Connected</span>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={disconnectLinkedIn} style={S.btnDisconnect}>Disconnect</motion.button>
                            </div>
                        ) : (
                            <motion.button whileHover={{ scale: 1.03, boxShadow: "0 8px 24px rgba(0,119,181,0.3)" }} whileTap={{ scale: 0.97 }}
                                onClick={loginLinkedIn} style={{ ...S.btnConnect, background: "linear-gradient(135deg, #0077B5, #00a0dc)" }}>Connect</motion.button>
                        )}
                    </motion.div>

                    {/* Twitter */}
                    <motion.div whileHover={{ y: -6 }}
                        ref={tiltTW.ref} onMouseMove={tiltTW.onMouseMove} onMouseLeave={tiltTW.onMouseLeave}
                        style={{
                            ...S.glassCard, flex: 1, borderRadius: 18, padding: "18px 20px",
                            borderColor: twitterConnected ? "rgba(29,155,240,0.3)" : "rgba(255,255,255,0.06)",
                            boxShadow: twitterConnected ? "0 10px 40px rgba(29,155,240,0.12), inset 0 1px 0 rgba(255,255,255,0.08)" : S.glassCard.boxShadow,
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #1a1a2e, #16213e)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                                <TwitterIcon size={15} color="#fff" />
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", flex: 1 }}>Twitter/X</span>
                            <div style={{
                                width: 10, height: 10, borderRadius: "50%",
                                background: twitterConnected ? "#00ff88" : "#334155",
                                boxShadow: twitterConnected ? "0 0 12px rgba(0,255,136,0.6)" : "none",
                            }} />
                        </div>
                        {twitterConnected ? (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 12, color: "#00ff88", fontWeight: 600 }}>✓ @{twitterScreenName}</span>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={disconnectTwitter} style={S.btnDisconnect}>Disconnect</motion.button>
                            </div>
                        ) : (
                            <motion.button whileHover={{ scale: 1.03, boxShadow: "0 8px 24px rgba(29,155,240,0.3)" }} whileTap={{ scale: 0.97 }}
                                onClick={loginTwitter} style={{ ...S.btnConnect, background: "linear-gradient(135deg, #1d9bf0, #0c7abf)" }}>Connect</motion.button>
                        )}
                    </motion.div>
                </motion.div>

                {/* ════ CONTENT GENERATION CARD ═══════════════ */}
                <motion.div variants={cardVariants}
                    ref={tiltContent.ref} onMouseMove={tiltContent.onMouseMove} onMouseLeave={tiltContent.onMouseLeave}
                    style={{ ...S.glassCard, borderRadius: 24, padding: 32, marginBottom: 20 }}
                >
                    <div style={S.cardHeader}>
                        <div style={{ ...S.iconCircle, background: "linear-gradient(135deg, #f093fb, #f5576c)", boxShadow: "0 4px 16px rgba(240,147,251,0.3)" }}>
                            <span style={{ fontSize: 15 }}>✨</span>
                        </div>
                        <h2 style={S.cardTitle}>Generate Content</h2>
                    </div>
                    <input type="text" placeholder="Enter your topic (e.g., AI trends, startup tips...)" value={topic} onChange={(e) => setTopic(e.target.value)} style={S.input} onKeyDown={(e) => e.key === "Enter" && generateContent()} />
                    <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                        <div style={{ flex: 1 }}>
                            <label style={S.label}>🎨 Tone</label>
                            <select value={tone} onChange={(e) => setTone(e.target.value)} style={S.select}>
                                <option value="professional">Professional</option>
                                <option value="casual">Casual</option>
                                <option value="inspirational">Inspirational</option>
                                <option value="humorous">Humorous</option>
                                <option value="educational">Educational</option>
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={S.label}>📏 Length</label>
                            <select value={length} onChange={(e) => setLength(e.target.value)} style={S.select}>
                                <option value="short">Short</option>
                                <option value="medium">Medium</option>
                                <option value="long">Long</option>
                            </select>
                        </div>
                    </div>
                    <motion.button whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(240,147,251,0.35)" }} whileTap={{ scale: 0.97 }}
                        onClick={generateContent} disabled={loading}
                        style={{ ...S.btnGenerate, opacity: loading ? 0.8 : 1 }}
                    >
                        {loading ? <span style={S.loadingFlex}><span style={S.spinner} />Generating...</span> : "🪄 Generate Post"}
                    </motion.button>
                </motion.div>

                {/* ════ IMAGE CARD ════════════════════════════ */}
                <motion.div variants={cardVariants}
                    ref={tiltImage.ref} onMouseMove={tiltImage.onMouseMove} onMouseLeave={tiltImage.onMouseLeave}
                    style={{ ...S.glassCard, borderRadius: 24, padding: 32, marginBottom: 20 }}
                >
                    <div style={S.cardHeader}>
                        <div style={{ ...S.iconCircle, background: "linear-gradient(135deg, #4facfe, #00f2fe)", boxShadow: "0 4px 16px rgba(79,172,254,0.3)" }}>
                            <span style={{ fontSize: 15 }}>🖼️</span>
                        </div>
                        <h2 style={S.cardTitle}>Attach Image</h2>
                        <span style={S.badge}>Optional</span>
                    </div>
                    <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                        <input type="text" placeholder="Describe an image to generate..." value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} style={{ ...S.input, marginBottom: 0, flex: 1 }} onKeyDown={(e) => e.key === "Enter" && handleGenerateImage()} />
                        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            onClick={handleGenerateImage} disabled={generatingImage}
                            style={{ padding: "0 22px", fontSize: 13, fontWeight: 600, color: "#fff", background: "linear-gradient(135deg, #4facfe, #00f2fe)", border: "none", borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 110, opacity: generatingImage ? 0.7 : 1, boxShadow: "0 4px 16px rgba(79,172,254,0.25)" }}
                        >{generatingImage ? <span style={S.spinner} /> : "🎨 Generate"}</motion.button>

                        {/* Always-visible Add Image button to open file picker */}
                        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            onClick={() => fileInputRef.current?.click()}
                            style={{ padding: "0 18px", fontSize: 13, fontWeight: 600, color: "#fff", background: "linear-gradient(135deg, #f093fb, #f5576c)", border: "none", borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 110, boxShadow: "0 4px 16px rgba(240,147,251,0.25)" }}
                        >📎 Add Image</motion.button>
                    </div>

                    {imagePreviews.length === 0 ? (
                        <motion.div whileHover={{ borderColor: "rgba(79,172,254,0.5)", background: "rgba(79,172,254,0.04)" }}
                            onClick={() => fileInputRef.current?.click()}
                            style={{ border: "2px dashed rgba(79,172,254,0.2)", borderRadius: 16, padding: "32px 16px", textAlign: "center", cursor: "pointer", background: "rgba(255,255,255,0.02)", transition: "all 0.3s" }}
                        >
                            <svg width="52" height="52" viewBox="0 0 52 52" fill="none" style={{ marginBottom: 8 }}>
                                <rect x="4" y="8" width="44" height="36" rx="6" stroke="#4facfe" strokeWidth="2" fill="rgba(79,172,254,0.06)" />
                                <circle cx="18" cy="22" r="4" fill="rgba(79,172,254,0.35)" />
                                <path d="M4 34 L16 26 L26 32 L36 24 L48 34 L48 38 C48 41.3 45.3 44 42 44 L10 44 C6.7 44 4 41.3 4 38 Z" fill="rgba(0,119,181,0.18)" />
                                <line x1="26" y1="12" x2="26" y2="20" stroke="#4facfe" strokeWidth="2" strokeLinecap="round" />
                                <line x1="22" y1="16" x2="30" y2="16" stroke="#4facfe" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <div style={{ fontSize: 14, color: "#4facfe", fontWeight: 600 }}>Click to upload an image</div>
                            <div style={{ fontSize: 11, color: "#4a5568", marginTop: 4 }}>JPG, PNG, GIF — Max 10MB</div>
                        </motion.div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
                            {imagePreviews.map((src, i) => (
                                <div key={i} style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(79,172,254,0.08)", background: "rgba(0,0,0,0.16)" }}>
                                    <img src={src} alt={`preview-${i}`} style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
                                    <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 8 }}>
                                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => removeImage(i)}
                                            style={{ padding: "6px 10px", fontSize: 12, fontWeight: 600, color: "#fff", background: "rgba(245,87,108,0.85)", border: "none", borderRadius: 10, cursor: "pointer" }}>✕</motion.button>
                                        <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} onClick={() => fileInputRef.current?.click()}
                                            style={{ padding: "6px 10px", fontSize: 12, fontWeight: 600, color: "#fff", background: "linear-gradient(135deg, #4facfe, #00f2fe)", border: "none", borderRadius: 10, cursor: "pointer" }}>Replace</motion.button>
                                    </div>
                                    <div style={{ padding: "8px 12px", fontSize: 11, color: "#94a3b8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{selectedImages[i]?.name || `image-${i+1}`}</span>
                                        <span style={{ fontSize: 10, color: "#4a5568", background: "rgba(79,172,254,0.08)", padding: "2px 8px", borderRadius: 8 }}>{selectedImages[i] ? Math.round(selectedImages[i].size / 1024) : 0} KB</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} style={{ display: "none" }} />
                </motion.div>

                {/* ════ POST EDITOR CARD ══════════════════════ */}
                <motion.div variants={cardVariants}
                    ref={tiltEditor.ref} onMouseMove={tiltEditor.onMouseMove} onMouseLeave={tiltEditor.onMouseLeave}
                    style={{ ...S.glassCard, borderRadius: 24, padding: 32, marginBottom: 20 }}
                >
                    <div style={S.cardHeader}>
                        <div style={{ ...S.iconCircle, background: "linear-gradient(135deg, #667eea, #764ba2)", boxShadow: "0 4px 16px rgba(118,75,162,0.3)" }}>
                            <span style={{ fontSize: 15 }}>📝</span>
                        </div>
                        <h2 style={S.cardTitle}>{generatedText ? "Your Post" : "Post Editor"}</h2>
                        {generatedText && (
                            <span style={{ ...S.badge, background: charCount > 280 && postTo.twitter ? "rgba(245,87,108,0.12)" : "rgba(79,172,254,0.08)", color: charCount > 280 && postTo.twitter ? "#f5576c" : "#4facfe", borderColor: charCount > 280 && postTo.twitter ? "rgba(245,87,108,0.2)" : "rgba(79,172,254,0.15)" }}>
                                {charCount} chars {postTo.twitter && charCount > 280 ? "(over Twitter limit)" : ""}
                            </span>
                        )}
                    </div>

                    <textarea value={generatedText} onChange={(e) => setGeneratedText(e.target.value)} placeholder="Generate content above, or type your post here..." style={S.textarea} rows={8} />

                    <AnimatePresence>
                        {generatedText && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                style={{ display: "flex", gap: 10, marginBottom: 16 }}
                            >
                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={clearContent} style={S.btnClear}>🗑️ Clear</motion.button>
                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={generateContent} disabled={loading || !topic.trim()}
                                    style={{ ...S.btnRegenerate, opacity: (loading || !topic.trim()) ? 0.4 : 1 }}>{loading ? "⏳ Regenerating..." : "🔄 Regenerate"}</motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Preview */}
                    <AnimatePresence>
                        {(generatedText || imagePreviews.length > 0) && (
                            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
                                style={{ borderRadius: 14, marginBottom: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
                            >
                                <div style={{ fontSize: 10, fontWeight: 700, color: "#4a5568", padding: "6px 14px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.04)", textTransform: "uppercase", letterSpacing: "1.5px" }}>Preview</div>
                                <div style={{ padding: 14 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #0077B5, #004d73)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,119,181,0.3)" }}>
                                            <LinkedInIcon size={13} color="#fff" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>You</div>
                                            <div style={{ fontSize: 10, color: "#4a5568" }}>Just now · 🌐</div>
                                        </div>
                                    </div>
                                    {generatedText && <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7, marginBottom: 10, whiteSpace: "pre-wrap" }}>{generatedText.length > 180 ? generatedText.substring(0, 180) + "..." : generatedText}</div>}
                                    {imagePreviews.length > 0 && (
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8, marginBottom: 10 }}>
                                            {imagePreviews.map((src, idx) => (
                                                <img key={idx} src={src} alt={`post-preview-${idx}`} style={{ width: "100%", maxHeight: 170, objectFit: "cover", borderRadius: 10 }} />
                                            ))}
                                        </div>
                                    )}
                                    <div style={{ display: "flex", justifyContent: "space-around", paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: 11, color: "#4a5568" }}>
                                        <span>👍 Like</span><span>💬 Comment</span><span>🔄 Repost</span><span>📤 Send</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Platform Toggles + Post */}
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginRight: 4 }}>Post to:</span>
                            <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                                onClick={() => setPostTo(p => ({ ...p, linkedin: !p.linkedin }))} disabled={!linkedinConnected}
                                style={{
                                    display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 12, fontWeight: 600,
                                    borderRadius: 12, cursor: linkedinConnected ? "pointer" : "default",
                                    background: postTo.linkedin ? "rgba(0,119,181,0.12)" : "rgba(255,255,255,0.03)",
                                    border: `1px solid ${postTo.linkedin ? "rgba(0,119,181,0.3)" : "rgba(255,255,255,0.08)"}`,
                                    color: postTo.linkedin ? "#4facfe" : "#4a5568",
                                    boxShadow: postTo.linkedin ? "0 0 12px rgba(0,119,181,0.1)" : "none",
                                    opacity: linkedinConnected ? 1 : 0.4,
                                }}>
                                <LinkedInIcon size={14} color={postTo.linkedin ? "#0077B5" : "#4a5568"} />
                                <span>LinkedIn</span>
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                                onClick={() => setPostTo(p => ({ ...p, twitter: !p.twitter }))} disabled={!twitterConnected}
                                style={{
                                    display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 12, fontWeight: 600,
                                    borderRadius: 12, cursor: twitterConnected ? "pointer" : "default",
                                    background: postTo.twitter ? "rgba(29,155,240,0.1)" : "rgba(255,255,255,0.03)",
                                    border: `1px solid ${postTo.twitter ? "rgba(29,155,240,0.3)" : "rgba(255,255,255,0.08)"}`,
                                    color: postTo.twitter ? "#1d9bf0" : "#4a5568",
                                    boxShadow: postTo.twitter ? "0 0 12px rgba(29,155,240,0.1)" : "none",
                                    opacity: twitterConnected ? 1 : 0.4,
                                }}>
                                <TwitterIcon size={14} color={postTo.twitter ? "#1d9bf0" : "#4a5568"} />
                                <span>Twitter/X</span>
                            </motion.button>
                        </div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                onClick={copyToClipboard} disabled={!generatedText}
                                style={{ ...S.btnCopy, opacity: generatedText ? 1 : 0.3 }}>📋 Copy</motion.button>
                            <motion.button whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(0,119,181,0.35)" }} whileTap={{ scale: 0.97 }}
                                onClick={postContent} disabled={posting || !generatedText}
                                style={{ ...S.btnPost, opacity: (posting || !generatedText) ? 0.4 : 1 }}
                            >
                                {posting
                                    ? <span style={S.loadingFlex}><span style={S.spinner} />Posting...</span>
                                    : `📤 Post ${[postTo.linkedin && "LinkedIn", postTo.twitter && "Twitter"].filter(Boolean).join(" & ") || ""}`}
                            </motion.button>
                            <div style={{ marginLeft: 12, display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setScheduleEnabled(s => !s)}
                                        style={{ padding: '8px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', background: scheduleEnabled ? 'linear-gradient(135deg,#4facfe,#7c3aed)' : 'rgba(255,255,255,0.03)', color: scheduleEnabled ? '#fff' : '#94a3b8', cursor: 'pointer' }}>
                                        {scheduleEnabled ? '📅 Scheduling On' : '📅 Schedule (Off)'}
                                    </motion.button>
                                    <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: scheduleEnabled ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.12)', color: '#e2e8f0' }} />
                                    <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: scheduleEnabled ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.12)', color: '#e2e8f0' }} />
                                    <select value={scheduleAmPm} onChange={(e) => setScheduleAmPm(e.target.value)} style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: scheduleEnabled ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.12)', color: '#e2e8f0' }}>
                                        <option>AM</option>
                                        <option>PM</option>
                                    </select>
                                    <div style={{ fontSize: 12, color: scheduleEnabled ? '#cdeafe' : '#6b7280', marginLeft: 6 }}>{scheduleEnabled ? (scheduleDate && scheduleTime ? `Scheduled: ${scheduleDate} ${scheduleTime} ${scheduleAmPm}` : 'Choose date & time') : 'Scheduling is off'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ════ FOOTER ════════════════════════════════ */}
                <motion.div variants={cardVariants}
                    style={{ textAlign: "center", padding: "24px 0 12px", fontSize: 11, color: "#334155", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                    <LinkedInIcon size={12} color="#334155" />
                    <span>+</span>
                    <TwitterIcon size={12} color="#334155" />
                    <span style={{ marginLeft: 4 }}>Social Media Poster — Powered by AI</span>
                </motion.div>
            </motion.div>
        </div>
    );
}

/* ─── Shared Styles ───────────────────────────────────────────── */
const S = {
    glassCard: {
        background: "rgba(255, 255, 255, 0.025)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255, 255, 255, 0.07)",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
        position: "relative", overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        transformStyle: "preserve-3d",
    },
    cardHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 22 },
    iconCircle: { width: 38, height: 38, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    cardTitle: { fontSize: 18, fontWeight: 800, color: "#fff", margin: 0, flex: 1, letterSpacing: "-0.5px" },
    badge: { fontSize: 11, color: "#94a3b8", background: "rgba(255,255,255,0.05)", padding: "5px 14px", borderRadius: 20, fontWeight: 600, border: "1px solid rgba(255,255,255,0.08)" },
    input: {
        width: "100%", padding: "13px 18px", fontSize: 14,
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, outline: "none",
        boxSizing: "border-box", marginBottom: 16,
        background: "rgba(255,255,255,0.03)", color: "#e2e8f0",
        transition: "all 0.25s", fontFamily: "'Inter', sans-serif",
    },
    label: { display: "block", fontSize: 11, color: "#64748b", marginBottom: 6, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" },
    select: {
        width: "100%", padding: "11px 14px", fontSize: 13,
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, outline: "none",
        background: "rgba(255,255,255,0.03)", color: "#e2e8f0", cursor: "pointer",
        fontFamily: "'Inter', sans-serif",
    },
    textarea: {
        width: "100%", padding: "14px 18px", fontSize: 13, lineHeight: 1.7,
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, outline: "none",
        resize: "vertical", boxSizing: "border-box", marginBottom: 16,
        fontFamily: "'Inter', sans-serif",
        background: "rgba(255,255,255,0.03)", color: "#e2e8f0", minHeight: 130,
    },
    btnGenerate: {
        padding: "14px 28px", fontSize: 14, fontWeight: 700, color: "#fff",
        background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        border: "none", borderRadius: 14, width: "100%", cursor: "pointer",
        boxShadow: "0 6px 24px rgba(240,147,251,0.25)",
        fontFamily: "'Inter', sans-serif",
    },
    btnConnect: {
        width: "100%", padding: "11px", fontSize: 13, fontWeight: 700, color: "#fff",
        border: "none", borderRadius: 12, cursor: "pointer",
        fontFamily: "'Inter', sans-serif",
    },
    btnDisconnect: {
        padding: "6px 14px", fontSize: 11, fontWeight: 600, color: "#f5576c",
        background: "rgba(245,87,108,0.08)", border: "1px solid rgba(245,87,108,0.2)",
        borderRadius: 10, cursor: "pointer", fontFamily: "'Inter', sans-serif",
    },
    btnClear: {
        flex: 1, padding: "10px 18px", fontSize: 13, fontWeight: 600, color: "#f5576c",
        background: "rgba(245,87,108,0.06)", border: "1px solid rgba(245,87,108,0.15)",
        borderRadius: 12, cursor: "pointer", fontFamily: "'Inter', sans-serif",
    },
    btnRegenerate: {
        flex: 1, padding: "10px 18px", fontSize: 13, fontWeight: 600, color: "#c084fc",
        background: "rgba(192,132,252,0.06)", border: "1px solid rgba(192,132,252,0.15)",
        borderRadius: 12, cursor: "pointer", fontFamily: "'Inter', sans-serif",
    },
    btnCopy: {
        padding: "12px 18px", fontSize: 13, fontWeight: 600, color: "#4facfe",
        background: "rgba(79,172,254,0.06)", border: "1px solid rgba(79,172,254,0.15)",
        borderRadius: 12, cursor: "pointer", fontFamily: "'Inter', sans-serif",
    },
    btnPost: {
        flex: 1, padding: "12px 28px", fontSize: 14, fontWeight: 700, color: "#fff",
        background: "linear-gradient(135deg, #0077B5 0%, #00a0dc 100%)",
        border: "none", borderRadius: 14, cursor: "pointer",
        boxShadow: "0 6px 24px rgba(0,119,181,0.25)",
        fontFamily: "'Inter', sans-serif",
    },
    loadingFlex: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
    spinner: {
        display: "inline-block", width: 16, height: 16,
        border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff",
        borderRadius: "50%", animation: "spinnerAnim 0.6s linear infinite",
    },
};

export default Dashboard;