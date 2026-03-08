import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { withConvexProvider } from "../../lib/convex";
import type { Id } from "../../../convex/_generated/dataModel";
import RegistrationPass from "./RegistrationPass";

const BASE = import.meta.env.BASE_URL ?? "/";

function UserDashboard() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    setSessionToken(localStorage.getItem("cq_session"));
  }, []);

  const user = useQuery(
    api.auth.getCurrentUser,
    sessionToken ? { sessionToken } : "skip",
  );
  const registrations = useQuery(
    api.registrations.getUserRegistrations,
    sessionToken ? { sessionToken } : "skip",
  );
  const completePayment = useMutation(api.registrations.completePayment);

  const [payingId, setPayingId] = useState<string | null>(null);
  const [payResult, setPayResult] = useState<Record<string, string>>({});
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<
    string | null
  >(null);

  if (!sessionToken) return <NotLoggedIn />;
  if (user === undefined || registrations === undefined) return <Loader />;
  if (!user) return <NotLoggedIn />;

  const handleCompletePayment = async (regId: Id<"registrations">) => {
    if (!sessionToken) return;
    setPayingId(regId);
    try {
      const res = await completePayment({
        sessionToken,
        registrationId: regId,
      });
      if (res.success && res.entryCode) {
        setPayResult((p) => ({ ...p, [regId]: res.entryCode! }));
      }
    } finally {
      setPayingId(null);
    }
  };

  // If viewing registration pass detail
  if (selectedRegistrationId) {
    return (
      <div className="dash-wrap">
        <div className="dash-header">
          <div className="container">
            <button
              onClick={() => setSelectedRegistrationId(null)}
              className="back-button"
              style={{
                background: "none",
                border: "none",
                color: "#dfa651",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontFamily: "'Space Mono', monospace",
                marginBottom: "16px",
              }}
            >
              &larr; Back to Registrations
            </button>
            <h1 className="font-display dash-title">Event Pass</h1>
          </div>
        </div>
        <div className="container dash-body">
          <RegistrationPass
            registrationId={selectedRegistrationId as Id<"registrations">}
            sessionToken={sessionToken}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="dash-wrap">
      <div className="dash-header">
        <div className="container">
          <div className="section-tag" style={{ marginBottom: 10 }}>
            My Account
          </div>
          <h1 className="font-display dash-title">
            WELCOME,{" "}
            <span className="gradient-text">{user.name.toUpperCase()}</span>
          </h1>
          <p className="dash-email font-mono">{user.email}</p>
        </div>
      </div>

      <div className="container dash-body">
        <div className="dash-section">
          <div className="section-tag" style={{ marginBottom: 20 }}>
            My Registrations
          </div>

          {!registrations?.length && (
            <div className="empty-state sharp-card">
              <p
                className="font-mono"
                style={{
                  color: "rgba(245,240,232,0.3)",
                  fontSize: "0.72rem",
                  letterSpacing: "0.1em",
                }}
              >
                No registrations yet. Head over to&nbsp;
                <a href={`${BASE}events`} style={{ color: "#dfa651" }}>
                  Events
                </a>
                &nbsp;to sign up.
              </p>
            </div>
          )}

          <div className="reg-list">
            {registrations?.map((reg) => {
              const ev = (reg as any).event;
              const newCode = payResult[reg._id];
              return (
                <div key={reg._id} className="reg-card sharp-card">
                  <div className="reg-card-header">
                    <div>
                      <h3 className="font-display reg-event-title">
                        {ev?.title ?? "Event"}
                      </h3>
                      <div className="reg-card-meta font-mono">
                        {ev?.date} · {ev?.location}
                      </div>
                    </div>
                    <span
                      className={`status-chip font-mono status-${reg.paymentStatus}`}
                    >
                      {reg.paymentStatus}
                    </span>
                  </div>

                  {(reg.entryCode || newCode) && (
                    <div className="entry-block">
                      <p className="entry-label font-mono">Entry Code</p>
                      <div className="entry-code font-mono">
                        {newCode ?? reg.entryCode}
                      </div>
                      <button
                        className="btn-outline"
                        style={{
                          fontSize: "0.68rem",
                          padding: "8px 16px",
                          marginTop: "12px",
                          width: "100%",
                        }}
                        onClick={() => setSelectedRegistrationId(reg._id)}
                      >
                        View QR Code →
                      </button>
                    </div>
                  )}

                  {reg.paymentStatus === "pending" && !newCode && (
                    <div className="reg-actions">
                      <p className="pay-hint font-mono">
                        Payment of ₹{reg.amount} pending
                      </p>
                      <button
                        className="btn-primary"
                        style={{ fontSize: "0.68rem", padding: "10px 20px" }}
                        disabled={payingId === reg._id}
                        onClick={() =>
                          handleCompletePayment(reg._id as Id<"registrations">)
                        }
                      >
                        {payingId === reg._id
                          ? "Processing…"
                          : "Confirm Payment →"}
                      </button>
                    </div>
                  )}

                  {reg.submissionGdriveLink && (
                    <div className="sub-info font-mono">
                      <span style={{ color: "rgba(245,240,232,0.3)" }}>
                        Submission:
                      </span>
                      <a
                        href={reg.submissionGdriveLink}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#dfa651", marginLeft: 8 }}
                      >
                        View Link ↗
                      </a>
                    </div>
                  )}
                  {reg.submissionNotes && (
                    <p className="sub-notes">{reg.submissionNotes}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .dash-wrap { padding-top: 67px; min-height: 100vh; }
        .dash-header { padding: 60px 0 40px; background: rgba(34,109,11,0.04); border-bottom: 1px solid rgba(255,255,255,0.06); }
        .dash-title { font-size: clamp(2rem,5vw,3.5rem); line-height: 1; margin-bottom: 8px; }
        .dash-email { font-size: 0.68rem; letter-spacing: 0.1em; color: rgba(245,240,232,0.35); }
        .dash-body { padding: 48px 24px 80px; }
        .dash-section { margin-bottom: 60px; }
        .empty-state { padding: 32px; text-align: center; }
        .reg-list { display: flex; flex-direction: column; gap: 16px; }
        .reg-card { padding: 24px; }
        .reg-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
        .reg-event-title { font-size: 1.3rem; letter-spacing: 0.03em; color: #f5f0e8; margin-bottom: 4px; }
        .reg-card-meta { font-size: 0.62rem; letter-spacing: 0.08em; color: rgba(245,240,232,0.35); }
        .status-chip { font-size: 0.6rem; letter-spacing: 0.12em; text-transform: uppercase; padding: 4px 10px; clip-path: polygon(0 0,calc(100% - 4px) 0,100% 4px,100% 100%,0 100%); flex-shrink: 0; }
        .status-free { background: rgba(34,109,11,0.15); color: #226d0b; border: 1px solid rgba(34,109,11,0.3); }
        .status-paid { background: rgba(223,166,81,0.15); color: #dfa651; border: 1px solid rgba(223,166,81,0.3); }
        .status-pending { background: rgba(203,27,58,0.1); color: #cb1b3a; border: 1px solid rgba(203,27,58,0.3); }
        .entry-block { margin: 12px 0; padding: 16px; background: #000; border-radius: 4px; display: inline-block; }
        .entry-label { font-size: 0.55rem; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(255,255,255,0.35); margin-bottom: 6px; }
        .entry-code { font-size: 1.3rem; font-weight: bold; letter-spacing: 0.12em; color: #fff; }
        .reg-actions { display: flex; align-items: center; gap: 16px; margin-top: 12px; flex-wrap: wrap; }
        .pay-hint { font-size: 0.65rem; letter-spacing: 0.06em; color: #dfa651; }
        .sub-info { font-size: 0.68rem; letter-spacing: 0.06em; margin-top: 10px; }
        .sub-notes { font-size: 0.78rem; color: rgba(245,240,232,0.45); margin-top: 6px; line-height: 1.6; }
        .back-button { transition: color 0.2s; }
        .back-button:hover { color: #226d0b; }
      `}</style>
    </div>
  );
}

function Loader() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <span
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "0.72rem",
          letterSpacing: "0.2em",
          color: "rgba(245,240,232,0.3)",
        }}
      >
        Loading…
      </span>
    </div>
  );
}

function NotLoggedIn() {
  const BASE = import.meta.env.BASE_URL ?? "/";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        flexDirection: "column",
        gap: 20,
        padding: 24,
      }}
    >
      <p
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "0.72rem",
          letterSpacing: "0.15em",
          color: "rgba(245,240,232,0.4)",
        }}
      >
        Please sign in to view your dashboard.
      </p>
      <a href={BASE} className="btn-primary">
        Back to Home →
      </a>
    </div>
  );
}

export default withConvexProvider(UserDashboard);
