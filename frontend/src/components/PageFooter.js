"use client";

import Link from "next/link";
import { useState } from "react";
import { Clock, ShieldCheck, Calendar, Facebook, Instagram, Youtube, Twitter } from "lucide-react";

export default function HomeFooter() {
  const [email, setEmail] = useState("");

  const handleSubscribe = () => {
    if (email) {
      alert(`Đăng ký thành công với email: ${email}`);
      setEmail("");
    }
  };

  return (
    <div className="w-full" style={{ fontFamily: "'Nunito', 'Be Vietnam Pro', sans-serif" }}>
      {/* ===== SECTION 2: BANNER APP ===== */}
      <section style={{ backgroundColor: "#f8fafc", padding: "64px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{
            borderRadius: 40,
            background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)",
            overflow: "hidden",
            boxShadow: "0 24px 64px rgba(124,58,237,0.35)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "52px 64px",
            gap: 32,
            position: "relative"
          }}>
            {/* Decorative circles */}
            <div style={{ position: "absolute", top: -60, right: 200, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -80, left: "40%", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

            {/* Text */}
            <div style={{ flex: "1 1 320px", zIndex: 1 }}>
              <h2 style={{ color: "white", fontSize: 32, fontWeight: 800, lineHeight: 1.35, marginBottom: 16 }}>
                Đặt sân mọi lúc mọi nơi<br />với ứng dụng SportBook
              </h2>
              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, marginBottom: 32, lineHeight: 1.6 }}>
                Tải ngay ứng dụng để nhận ưu đãi đặc biệt cho lần đặt sân đầu tiên của bạn.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {[
                  { sub: "Download on the", main: "App Store" },
                  { sub: "GET IT ON", main: "Google Play" }
                ].map((btn, i) => (
                  <button key={i} style={{
                    backgroundColor: "rgba(0,0,0,0.75)",
                    backdropFilter: "blur(8px)",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 12,
                    padding: "10px 20px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s"
                  }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.9)")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.75)")}
                  >
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>{btn.sub}</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{btn.main}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Phone mockup */}
            <div style={{
              width: 180, height: 340,
              backgroundColor: "#111",
              borderRadius: 32,
              border: "6px solid #333",
              boxShadow: "0 24px 48px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transform: "rotate(-6deg)",
              marginBottom: -48,
              zIndex: 1,
              flexShrink: 0
            }}>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600 }}>App Screen</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 3: FOOTER LINKS ===== */}
      <footer style={{ backgroundColor: "white", borderTop: "1px solid #f1f5f9" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "64px 24px 32px" }}>

          {/* 4 Columns */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "48px",
            marginBottom: 48
          }}>

            {/* Col 1: Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <div style={{
                  width: 36, height: 36,
                  backgroundColor: "#f97316",
                  borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <span style={{ color: "white", fontWeight: 900, fontSize: 16 }}>S</span>
                </div>
                <span style={{ fontSize: 22, fontWeight: 800, color: "#f97316" }}>SportBook</span>
              </div>
              <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, marginBottom: 20, maxWidth: 240 }}>
                Nền tảng đặt sân thể thao hàng đầu Việt Nam, giúp kết nối người chơi và chủ sân dễ dàng.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { icon: <Facebook size={16} />, label: "Facebook" },
                  { icon: <Instagram size={16} />, label: "Instagram" },
                  { icon: <Twitter size={16} />, label: "Twitter" },
                  { icon: <Youtube size={16} />, label: "Youtube" },
                ].map(({ icon, label }) => (
                  <button key={label} aria-label={label} style={{
                    width: 36, height: 36,
                    borderRadius: "50%",
                    backgroundColor: "#f1f5f9",
                    border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    color: "#64748b",
                    transition: "all 0.2s"
                  }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#fff7ed"; e.currentTarget.style.color = "#f97316"; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#f1f5f9"; e.currentTarget.style.color = "#64748b"; }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Col 2: Về chúng tôi */}
            <div>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 24 }}>
                Về chúng tôi
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                {["Giới thiệu", "Tuyển dụng", "Điều khoản sử dụng", "Chính sách bảo mật"].map(item => (
                  <li key={item}>
                    <Link href="/" style={{ color: "#64748b", fontSize: 14, textDecoration: "none", transition: "color 0.2s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#f97316")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Hỗ trợ */}
            <div>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 24 }}>
                Hỗ trợ khách hàng
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                {["Hướng dẫn đặt sân", "Chính sách đổi trả", "Câu hỏi thường gặp", "Liên hệ"].map(item => (
                  <li key={item}>
                    <Link href="/" style={{ color: "#64748b", fontSize: 14, textDecoration: "none", transition: "color 0.2s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#f97316")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4: Newsletter */}
            <div>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 24 }}>
                Đăng ký nhận tin
              </h3>
              <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
                Nhận thông tin về các giải đấu và ưu đãi mới nhất.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email của bạn"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: "1.5px solid #e2e8f0",
                    fontSize: 14,
                    color: "#334155",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    transition: "border-color 0.2s"
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#f97316")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
                />
                <button
                  onClick={handleSubscribe}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 10,
                    backgroundColor: "#f97316",
                    color: "white",
                    fontWeight: 700,
                    fontSize: 14,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "background-color 0.2s"
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#ea6d0a")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#f97316")}
                >
                  Đăng ký
                </button>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 24, textAlign: "center" }}>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#94a3b8", margin: 0 }}>
              © 2026 SportBook. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}