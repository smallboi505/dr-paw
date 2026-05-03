"use client";

import { useState } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  const prices = {
    monthly: { pro: "₵899", ent: "₵1,699", period: "/ month" },
    annual: { pro: "₵8,990", ent: "₵16,990", period: "/ year (2 months free)" },
  };

  const p = prices[billing];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { overflow-x: hidden; }
        .nav-link { font-size: 13px; font-weight: 500; color: #1a1a1a; text-decoration: none; letter-spacing: 0.5px; text-transform: uppercase; transition: color 0.2s; }
        .nav-link:hover { color: #C00000; }
        .btn-trial:hover { background: transparent !important; color: white !important; }
        .plan-btn:hover { background: #C00000 !important; color: white !important; }
        .plan-card { transition: transform 0.2s, box-shadow 0.2s; }
        .plan-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.1); }
        .plan-card.featured:hover { transform: scale(1.03) translateY(-4px) !important; }
        .footer-link { font-size: 13px; color: rgba(255,255,255,0.35); text-decoration: none; transition: color 0.2s; display: block; padding: 4px 0; }
        .footer-link:hover { color: rgba(255,255,255,0.7); }
        .footer-legal-link { font-size: 12px; color: rgba(255,255,255,0.2); text-decoration: none; transition: color 0.2s; }
        .footer-legal-link:hover { color: rgba(255,255,255,0.5); }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)",
        borderBottom: "1px solid #E8E8E8",
        padding: "0 60px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, background: "#C00000", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🐾</div>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>Dr. Paw</span>
        </Link>
        <ul style={{ display: "flex", alignItems: "center", gap: 48, listStyle: "none" }}>
          <li><a href="#home" className="nav-link">HOME</a></li>
          <li><a href="#features" className="nav-link">FEATURES</a></li>
          <li><a href="#pricing" className="nav-link">PRICING</a></li>
        </ul>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/sign-in" style={{ background: "#C00000", color: "white", padding: "9px 22px", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none", letterSpacing: "0.3px" }}>LOG IN</Link>
          <Link href="/sign-up" style={{ background: "transparent", color: "#C00000", padding: "9px 22px", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none", border: "1.5px solid #C00000", letterSpacing: "0.3px" }}>SIGN UP</Link>
        </div>
      </nav>

      {/* HERO */}
      <section id="home" style={{
        background: "#C00000", paddingTop: 100, paddingBottom: 60,
        paddingLeft: 60, paddingRight: 60,
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 60, alignItems: "center", minHeight: 420
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginBottom: 16 }}>
            Veterinary Clinic Management
          </div>
          <h1 style={{ fontSize: "clamp(32px,4vw,52px)", fontWeight: 800, color: "white", lineHeight: 1.1, letterSpacing: -1, marginBottom: 16 }}>
            The smarter way to<br/>run your clinic.
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", lineHeight: 1.7, marginBottom: 32, maxWidth: 440, fontWeight: 300 }}>
            Dr. Paw helps veterinary clinics go fully paperless. Manage pets, owners, appointments, medical records and staff — all in one place.
          </p>
          <Link href="/sign-up" className="btn-trial" style={{
            background: "white", color: "#C00000", padding: "13px 28px",
            fontSize: 14, fontWeight: 700, borderRadius: 8, textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: 8,
            border: "2px solid white", transition: "all 0.2s", letterSpacing: "0.5px"
          }}>
            START YOUR 30 DAY TRIAL →
          </Link>
        </div>

        {/* Dashboard mockup */}
        <div>
          <div style={{
            background: "white", borderRadius: 16,
            boxShadow: "0 24px 80px rgba(0,0,0,0.25)", overflow: "hidden",
            transform: "perspective(800px) rotateY(-5deg) rotateX(2deg)"
          }}>
            <div style={{ background: "#f8f8f8", borderBottom: "1px solid #eee", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5f56", display: "block" }}></span>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ffbd2e", display: "block" }}></span>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#27c93f", display: "block" }}></span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#999" }}>DR. PAW DASHBOARD</span>
              <div></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "120px 1fr" }}>
              <div style={{ background: "#C00000", padding: "12px 0" }}>
                {["Dashboard", "Pets", "Owners", "Appointments", "Reports", "Settings"].map((item, i) => (
                  <div key={item} style={{
                    padding: "7px 14px", fontSize: 10,
                    color: i === 0 ? "white" : "rgba(255,255,255,0.65)",
                    display: "flex", alignItems: "center", gap: 6,
                    background: i === 0 ? "rgba(255,255,255,0.15)" : "transparent",
                    fontWeight: i === 0 ? 600 : 400
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: i === 0 ? "white" : "rgba(255,255,255,0.4)", display: "block", flexShrink: 0 }}></span>
                    {item}
                  </div>
                ))}
              </div>
              <div style={{ padding: 14, background: "#f9f9f9" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 12 }}>Dashboard</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 12 }}>
                  {[["Appointments", "8"], ["Total Pets", "247"], ["This Week", "34"]].map(([label, val]) => (
                    <div key={label} style={{ background: "white", borderRadius: 6, padding: "8px 10px", border: "1px solid #eee" }}>
                      <div style={{ fontSize: 9, color: "#999", marginBottom: 3 }}>{label}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#C00000" }}>{val}</div>
                    </div>
                  ))}
                </div>
                {[["B","Brownie","Poodle · MC/VC/1821"],["Z","Zara","Malinois · MC/VC/1785"],["M","Maximus","Shepherd · MC/VC/1733"]].map(([letter, name, breed]) => (
                  <div key={name} style={{ background: "white", borderRadius: 6, padding: "7px 10px", display: "grid", gridTemplateColumns: "18px 1fr 50px", gap: 6, alignItems: "center", border: "1px solid #eee", marginBottom: 4 }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#F8E8E8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#C00000" }}>{letter}</div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#1a1a1a" }}>{name}</div>
                      <div style={{ fontSize: 9, color: "#999" }}>{breed}</div>
                    </div>
                    <div style={{ fontSize: 8, padding: "2px 6px", borderRadius: 10, background: "#e8f5e9", color: "#2e7d32", fontWeight: 600, textAlign: "center" }}>Active</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: "80px 60px", background: "white" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#C00000", marginBottom: 12 }}>Features</div>
          <h2 style={{ fontSize: "clamp(28px,3.5vw,42px)", fontWeight: 800, color: "#1a1a1a", letterSpacing: -0.5, lineHeight: 1.2 }}>Everything your clinic needs</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 40, maxWidth: 1000, margin: "0 auto" }}>
          {[
            ["🐾", "Pet Records", "Full medical histories, visit logs and ID management for every patient. Searchable in seconds."],
            ["👤", "Owner Management", "Keep owner contacts, addresses and pet associations organised and always up to date."],
            ["📅", "Appointments", "Book, track and manage appointments with status updates from confirmed to completed."],
            ["📋", "Medical Records", "Record diagnoses, treatments, prescriptions and follow-up notes tied to every visit."],
            ["👥", "Staff Management", "Invite vets, nurses and receptionists with role-based access. Control who sees what."],
            ["📦", "Bulk CSV Import", "Migrating from paper? Import hundreds of records at once with built-in row validation."],
          ].map(([icon, title, desc]) => (
            <div key={title} style={{ textAlign: "center", padding: "0 20px" }}>
              <div style={{ width: 64, height: 64, background: "#E8E8E8", borderRadius: "50%", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>{icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>{title}</div>
              <p style={{ fontSize: 13, color: "#6B6B6B", lineHeight: 1.65 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: "80px 60px", background: "#F5F5F5" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#C00000", marginBottom: 12 }}>Pricing</div>
          <h2 style={{ fontSize: "clamp(28px,3.5vw,42px)", fontWeight: 800, color: "#1a1a1a", letterSpacing: -0.5 }}>Available Plans</h2>
        </div>

        {/* Toggle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 48 }}>
          <div style={{ background: "white", border: "1.5px solid #E8E8E8", borderRadius: 30, padding: 4, display: "flex" }}>
            {(["monthly", "annual"] as const).map((b) => (
              <button key={b} onClick={() => setBilling(b)} style={{
                padding: "8px 24px", borderRadius: 24, fontSize: 13, fontWeight: 600,
                letterSpacing: "0.5px", cursor: "pointer", border: "none",
                background: billing === b ? "#C00000" : "transparent",
                color: billing === b ? "white" : "#6B6B6B",
                transition: "all 0.2s", textTransform: "uppercase"
              }}>{b}</button>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24, maxWidth: 1000, margin: "0 auto" }}>
          {/* FREE */}
          <div className="plan-card" style={{ background: "white", border: "1.5px solid #E8E8E8", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "28px 24px 0" }}>
              <div style={{ fontSize: 28, fontWeight: 800, fontStyle: "italic", color: "#C00000", marginBottom: 4 }}>FREE</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#1a1a1a", letterSpacing: -1, marginBottom: 20 }}>₵0</div>
              <div style={{ background: "#C00000", borderRadius: 12, padding: 20, marginBottom: 24 }}>
                <ul style={{ listStyle: "none" }}>
                  {["1 Admin account","Up to 50 pet records","Appointments & visits","Export records (CSV)","Basic reporting"].map(f => (
                    <li key={f} style={{ fontSize: 12, color: "#36346A", padding: "4px 0", fontWeight: 500 }}>✓ {f}</li>
                  ))}
                </ul>
              </div>
            </div>
            <Link href="/sign-up" className="plan-btn" style={{ display: "block", margin: "0 24px 24px", padding: 12, textAlign: "center", borderRadius: 8, fontSize: 13, fontWeight: 700, letterSpacing: "0.5px", textDecoration: "none", border: "2px solid #E8E8E8", color: "#6B6B6B" }}>GET STARTED FREE</Link>
          </div>

          {/* PRO */}
          <div className="plan-card featured" style={{ background: "white", border: "2px solid #C00000", borderRadius: 16, overflow: "hidden", transform: "scale(1.03)", position: "relative" }}>
            <div style={{ position: "absolute", top: 16, right: 16, background: "#36346A", color: "white", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, letterSpacing: "0.5px" }}>POPULAR</div>
            <div style={{ padding: "28px 24px 0" }}>
              <div style={{ fontSize: 28, fontWeight: 800, fontStyle: "italic", color: "#C00000", marginBottom: 4 }}>PRO</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#1a1a1a", letterSpacing: -1, marginBottom: 4 }}>{p.pro} <span style={{ fontSize: 14, fontWeight: 500, color: "#6B6B6B" }}>{p.period}</span></div>
              <div style={{ background: "#C00000", borderRadius: 12, padding: 20, marginBottom: 24, marginTop: 16 }}>
                <ul style={{ listStyle: "none" }}>
                  {["Everything in Free","Up to 300 pet records","1 Admin + 2 Vets","CSV import & export","Full medical records","Onboarding training session","Email support (24hr response)"].map(f => (
                    <li key={f} style={{ fontSize: 12, color: "#36346A", padding: "4px 0", fontWeight: 500 }}>✓ {f}</li>
                  ))}
                </ul>
              </div>
            </div>
            <Link href="/sign-up" className="plan-btn" style={{ display: "block", margin: "0 24px 24px", padding: 12, textAlign: "center", borderRadius: 8, fontSize: 13, fontWeight: 700, letterSpacing: "0.5px", textDecoration: "none", border: "2px solid #C00000", color: "#C00000" }}>UPGRADE TO PRO</Link>
          </div>

          {/* ENTERPRISE */}
          <div className="plan-card" style={{ background: "white", border: "1.5px solid #E8E8E8", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "28px 24px 0" }}>
              <div style={{ fontSize: 28, fontWeight: 800, fontStyle: "italic", color: "#C00000", marginBottom: 4 }}>ENTERPRISE</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#1a1a1a", letterSpacing: -1, marginBottom: 4 }}>{p.ent} <span style={{ fontSize: 14, fontWeight: 500, color: "#6B6B6B" }}>{p.period}</span></div>
              <div style={{ background: "#C00000", borderRadius: 12, padding: 20, marginBottom: 24, marginTop: 16 }}>
                <ul style={{ listStyle: "none" }}>
                  {["Everything in Pro","Unlimited pet records","2 Admins · 10 Vets · 10 Nurses · 2 Receptionists","Custom pet ID formats","Dedicated account manager","Onboarding + workshops on request","Custom branding on exports","24/7 priority support"].map(f => (
                    <li key={f} style={{ fontSize: 12, color: "#36346A", padding: "4px 0", fontWeight: 500 }}>✓ {f}</li>
                  ))}
                </ul>
              </div>
            </div>
            <Link href="/sign-up" className="plan-btn" style={{ display: "block", margin: "0 24px 24px", padding: 12, textAlign: "center", borderRadius: 8, fontSize: 13, fontWeight: 700, letterSpacing: "0.5px", textDecoration: "none", border: "2px solid #C00000", color: "#C00000" }}>UPGRADE TO ENTERPRISE</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#1a1a1a", padding: "48px 60px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 48, paddingBottom: 40, borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, background: "#C00000", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🐾</div>
              <span style={{ fontSize: 18, fontWeight: 700, color: "white" }}>Dr. Paw</span>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, marginTop: 12, maxWidth: 260, fontWeight: 300 }}>
              Veterinary clinic management software built for modern practices — from solo vets to multi-branch clinics.
            </p>
          </div>
          {[
            ["Product", [["Home","#home"],["Features","#features"],["Pricing","#pricing"],["Sign Up","/sign-up"]]],
            ["Company", [["About","#"],["Contact","mailto:hello@drpawgh.com"],["Blog","#"]]],
            ["Legal", [["Privacy Policy","#"],["Terms of Service","#"],["Cookie Policy","#"]]],
          ].map(([title, links]) => (
            <div key={title as string}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>{title as string}</div>
              {(links as [string, string][]).map(([label, href]) => (
                <a key={label} href={href} className="footer-link">{label}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>© 2026 Dr. Paw. All rights reserved.</span>
          <div style={{ display: "flex", gap: 20 }}>
            {["Privacy","Terms","Cookies"].map(l => <a key={l} href="#" className="footer-legal-link">{l}</a>)}
          </div>
        </div>
      </footer>
    </div>
  );
}