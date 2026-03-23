import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { withConvexProvider } from "../../lib/convex";
import type { Id } from "../../../convex/_generated/dataModel";
import RegistrationPass from "./RegistrationPass";
import { UPIPaymentUpload } from "../payments/UPIPaymentUpload";

const BASE = import.meta.env.BASE_URL ?? "/";

function UserDashboard() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [reapplyMsg, setReapplyMsg] = useState<string>("");

  const reapplyForPayment = useMutation(api.registrations.reapplyForPayment);

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

  const [selectedRegistrationId, setSelectedRegistrationId] = useState<
    string | null
  >(null);

  if (!sessionToken) return <NotLoggedIn />;
  if (user === undefined || registrations === undefined) return <Loader />;
  if (!user) return <NotLoggedIn />;

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
              const showUPIUpload =
                reg.paymentStatus === "pending" &&
                !reg.entryCode &&
                !reg.paymentProofUrl;
              const verificationPending =
                reg.paymentVerificationStatus === "pending";
              const verificationRejected =
                reg.paymentVerificationStatus === "rejected";

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
                    <div
                      style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                    >
                      <span
                        className={`status-chip font-mono status-${reg.paymentStatus}`}
                      >
                        {reg.paymentStatus}
                      </span>
                      {reg.paymentVerificationStatus && (
                        <span
                          className="status-chip font-mono"
                          style={{
                            background:
                              reg.paymentVerificationStatus === "approved"
                                ? "rgba(34, 109, 11, 0.15)"
                                : reg.paymentVerificationStatus === "rejected"
                                  ? "rgba(203, 27, 58, 0.1)"
                                  : "rgba(223, 166, 81, 0.15)",
                            color:
                              reg.paymentVerificationStatus === "approved"
                                ? "#226d0b"
                                : reg.paymentVerificationStatus === "rejected"
                                  ? "#cb1b3a"
                                  : "#dfa651",
                            border:
                              reg.paymentVerificationStatus === "approved"
                                ? "1px solid rgba(34, 109, 11, 0.3)"
                                : reg.paymentVerificationStatus === "rejected"
                                  ? "1px solid rgba(203, 27, 58, 0.3)"
                                  : "1px solid rgba(223, 166, 81, 0.3)",
                          }}
                        >
                          Verification: {reg.paymentVerificationStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  {reg.entryCode && (
                    <div className="entry-block">
                      <p className="entry-label font-mono">Entry Code</p>
                      <div className="entry-code font-mono">
                        {reg.entryCode}
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

                  {showUPIUpload && sessionToken && (
                    <div style={{ marginTop: "16px" }}>
                      <UPIPaymentUpload
                        registrationId={reg._id as Id<"registrations">}
                        sessionToken={sessionToken}
                        amount={reg.amount}
                        onSuccess={() => setUploadingId(null)}
                      />
                    </div>
                  )}

                  {verificationPending && reg.paymentProofUrl && (
                    <div
                      style={{
                        marginTop: "16px",
                        padding: "12px",
                        background: "rgba(223, 166, 81, 0.08)",
                        border: "1px solid rgba(223, 166, 81, 0.2)",
                        borderRadius: "4px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "0.7rem",
                          color: "rgba(245, 240, 232, 0.5)",
                          marginBottom: "8px",
                        }}
                      >
                        Payment Verification Status
                      </p>
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "#dfa651",
                          fontFamily: "'Space Mono', monospace",
                        }}
                      >
                        ⏳ Pending admin verification
                      </p>
                      <p
                        style={{
                          fontSize: "0.65rem",
                          color: "rgba(245, 240, 232, 0.4)",
                          marginTop: "6px",
                        }}
                      >
                        Your payment screenshot is being reviewed. You'll
                        receive an entry code once approved.
                      </p>
                    </div>
                  )}

                  {verificationRejected && (
                    <div
                      style={{
                        marginTop: "16px",
                        padding: "12px",
                        background: "rgba(203, 27, 58, 0.1)",
                        border: "1px solid rgba(203, 27, 58, 0.3)",
                        borderRadius: "4px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "0.7rem",
                          color: "rgba(245, 240, 232, 0.5)",
                          marginBottom: "8px",
                        }}
                      >
                        Verification Rejected
                      </p>
                      {reg.paymentVerificationNotes && (
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#cb1b3a",
                            marginBottom: "8px",
                          }}
                        >
                          {reg.paymentVerificationNotes}
                        </p>
                      )}
                      <p
                        style={{
                          fontSize: "0.65rem",
                          color: "rgba(245, 240, 232, 0.4)",
                          marginBottom: "12px",
                        }}
                      >
                        Please upload a valid payment proof screenshot.
                      </p>
                      {reapplyMsg && (
                        <div
                          style={{
                            fontSize: "0.65rem",
                            color: reapplyMsg.startsWith("✓")
                              ? "#226d0b"
                              : "#cb1b3a",
                            marginBottom: "8px",
                            padding: "8px",
                            background: reapplyMsg.startsWith("✓")
                              ? "rgba(34, 109, 11, 0.1)"
                              : "rgba(203, 27, 58, 0.1)",
                            borderRadius: "4px",
                          }}
                        >
                          {reapplyMsg}
                        </div>
                      )}
                      <button
                        className="btn-primary"
                        style={{
                          fontSize: "0.7rem",
                          padding: "8px 12px",
                          width: "100%",
                        }}
                        onClick={async () => {
                          setReapplyMsg("");
                          if (!sessionToken) return;
                          try {
                            const res = await reapplyForPayment({
                              sessionToken,
                              registrationId: reg._id as Id<"registrations">,
                            });
                            if (res.success) {
                              setReapplyMsg("✓ " + res.message);
                            } else {
                              setReapplyMsg("✗ " + res.error);
                            }
                          } catch (e: any) {
                            setReapplyMsg("✗ " + e.message);
                          }
                        }}
                      >
                        Reapply with New Payment Proof →
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
