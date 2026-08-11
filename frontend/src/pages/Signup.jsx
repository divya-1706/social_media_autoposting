import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

function Signup() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError("Passwords do not match");
        }
        setLoading(true);
        setError("");
        try {
            localStorage.removeItem("token");
            const res = await axios.post(`${API}/auth/signup`, { email, password });
            localStorage.setItem("token", res.data.access_token);
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.detail || "Signup failed. Email might already exist.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            {/* Decorative background blobs for color */}
            <div style={styles.blob1}></div>
            <div style={styles.blob2}></div>

            <div style={styles.glassCard}>
                <div style={styles.logoContainer}>
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png"
                        alt="LinkedIn Logo"
                        style={styles.logo}
                    />
                </div>

                <h1 style={styles.title}>Join Us</h1>
                <p style={styles.subtitle}>Start your professional AI journey</p>

                <form onSubmit={handleSignup} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Email Address</label>
                        <input
                            type="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Password</label>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            placeholder="Create a strong password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={styles.input}
                            autoComplete="new-password"
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            id="confirmPassword"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            style={styles.input}
                            autoComplete="new-password"
                        />
                    </div>

                    {error && <p style={styles.error}>{error}</p>}

                    <button type="submit" disabled={loading} style={styles.button}>
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                <p style={styles.footer}>
                    Already have an account? <Link to="/login" style={styles.link}>Sign in instead</Link>
                </p>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0a1628 0%, #1e293b 100%)",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
    },
    blob1: {
        position: "absolute",
        top: "-10%",
        right: "-10%",
        width: "400px",
        height: "400px",
        background: "radial-gradient(circle, rgba(0, 119, 181, 0.4) 0%, transparent 70%)",
        filter: "blur(60px)",
        zIndex: 0,
    },
    blob2: {
        position: "absolute",
        bottom: "-10%",
        left: "-10%",
        width: "400px",
        height: "400px",
        background: "radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)",
        filter: "blur(60px)",
        zIndex: 0,
    },
    glassCard: {
        background: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: "32px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        padding: "48px",
        width: "100%",
        maxWidth: "460px",
        boxShadow: "0 40px 100px -20px rgba(0, 0, 0, 0.5)",
        zIndex: 10,
        animation: "fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
    },
    logoContainer: {
        display: "flex",
        justifyContent: "center",
        marginBottom: "24px",
    },
    logo: {
        width: "48px",
        height: "48px",
        filter: "drop-shadow(0 0 10px rgba(0, 119, 181, 0.5))",
    },
    title: {
        color: "#fff",
        fontSize: "36px",
        fontWeight: "800",
        marginBottom: "12px",
        textAlign: "center",
        letterSpacing: "-1px",
        background: "linear-gradient(to right, #fff, #94a3b8)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
    },
    subtitle: {
        color: "#94a3b8",
        fontSize: "17px",
        marginBottom: "40px",
        textAlign: "center",
        fontWeight: "400",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    label: {
        color: "#cbd5e1",
        fontSize: "14px",
        fontWeight: "600",
        marginLeft: "4px",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    input: {
        width: "100%",
        boxSizing: "border-box",
        padding: "16px 20px",
        borderRadius: "16px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        color: "#fff",
        fontSize: "16px",
        outline: "none",
        transition: "all 0.3s ease",
    },
    button: {
        padding: "16px",
        borderRadius: "16px",
        background: "linear-gradient(135deg, #0077b5 0%, #00a0dc 100%)",
        color: "#fff",
        border: "none",
        fontSize: "17px",
        fontWeight: "700",
        cursor: "pointer",
        marginTop: "12px",
        boxShadow: "0 10px 25px -5px rgba(0, 119, 181, 0.4)",
        transition: "all 0.3s ease",
    },
    error: {
        color: "#f87171",
        fontSize: "14px",
        textAlign: "center",
        background: "rgba(248, 113, 113, 0.1)",
        padding: "12px",
        borderRadius: "12px",
        border: "1px solid rgba(248, 113, 113, 0.2)",
    },
    footer: {
        color: "#64748b",
        fontSize: "15px",
        marginTop: "32px",
        textAlign: "center",
    },
    link: {
        color: "#00a0dc",
        textDecoration: "none",
        fontWeight: "700",
        transition: "color 0.2s ease",
    },
};

export default Signup;
