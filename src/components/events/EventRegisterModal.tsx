import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { withConvexProvider } from "../../lib/convex";
import type { Id } from "../../../convex/_generated/dataModel";

interface Props {
  eventId: Id<"events">;
  sessionToken: string;
  onClose: () => void;
}

const BASE = import.meta.env.BASE_URL ?? "/";

function EventRegisterModal({ eventId, sessionToken, onClose }: Props) {
  const event = useQuery(api.events.listEvents);
  const ev = event?.find((e) => e._id === eventId);

  const registerMutation = useMutation(api.registrations.registerForEvent);

  const [submissionType, setSubmissionType] = useState<"gdrive_link" | "none">(
    "none",
  );
  const [gdriveLink, setGdriveLink] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    entryCode?: string;
    paymentStatus?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (submissionType === "gdrive_link" && !gdriveLink.trim()) {
      setError("Please provide a Google Drive / cloud link.");
      return;
    }
    setLoading(true);
    try {
      const res = await registerMutation({
        sessionToken,
        eventId,
        paymentOption: "pay_now",
        submissionType,
        submissionGdriveLink:
          submissionType === "gdrive_link" ? gdriveLink.trim() : undefined,
        submissionNotes: submissionNotes.trim() || undefined,
      });
      if (!res.success) {
        setError(res.error ?? "Registration failed.");
        return;
      }
      setResult({ entryCode: res.entryCode, paymentStatus: res.paymentStatus });
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!ev) return null;

  const isFreeEvent = ev.isFree;
  const isPaidEventWithPendingPayment =
    !isFreeEvent && result?.paymentStatus === "pending";

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="reg-modal sharp-card">
        <button className="modal-close font-mono" onClick={onClose}>
          ✕
        </button>

        {result ? (
          <div className="reg-success">
            <div
              className="success-icon font-display"
              style={{ color: isFreeEvent ? "#226d0b" : "#dfa651" }}
            >
              ✓
            </div>
            <h2
              className="font-display reg-title"
              style={{ color: isFreeEvent ? "#226d0b" : "#dfa651" }}
            >
              REGISTERED!
            </h2>

            {/* Dynamic subtitle based on event type */}
            <p className="reg-subtitle">
              You're registered for <strong>{ev.title}</strong>
            </p>

            {/* Next steps indicator for paid events */}
            {isPaidEventWithPendingPayment && (
              <p className="reg-subtitle-secondary">
                Payment verification required to get your entry code
              </p>
            )}

            {/* Entry code for free events */}
            {isFreeEvent && result.entryCode && (
              <div className="entry-code-wrap">
                <p className="entry-label font-mono">Your Entry Code</p>
                <div className="entry-code font-mono">{result.entryCode}</div>
                <p className="entry-hint font-mono">
                  Save this — you'll need it at the door.
                </p>
              </div>
            )}

            {/* Payment verification guidance for paid events */}
            {isPaidEventWithPendingPayment && (
              <div className="verification-notice">
                <div className="notice-header font-mono">
                  <span className="pending-dot"></span>
                  Payment Verification Required
                </div>
                <div className="notice-content">
                  <p className="notice-text font-mono">
                    <strong>Next Step:</strong> Upload your UPI payment
                    screenshot in your dashboard
                  </p>
                  <p className="notice-text font-mono">
                    Once verified by admins, you'll receive your entry code via
                    email.
                  </p>
                  <p className="notice-timeline font-mono">
                    Verification usually takes 2 to 3 days.
                  </p>
                </div>
              </div>
            )}

            {isPaidEventWithPendingPayment ? (
              <a
                href={`${BASE}dashboard`}
                className="btn-primary"
                style={{
                  marginTop: 24,
                  display: "inline-block",
                  textDecoration: "none",
                }}
              >
                Go to Dashboard &rarr;
              </a>
            ) : (
              <button
                className="btn-primary"
                style={{ marginTop: 24 }}
                onClick={onClose}
              >
                Done &rarr;
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="reg-header">
              <div className="section-tag" style={{ marginBottom: 10 }}>
                Register
              </div>
              <h2 className="font-display reg-title">{ev.title}</h2>
              <div className="reg-meta font-mono">
                <span>{ev.date}</span>
                <span className="meta-sep">·</span>
                <span>{ev.location}</span>
                <span className="meta-sep">·</span>
                <span style={{ color: ev.isFree ? "#226d0b" : "#dfa651" }}>
                  {ev.isFree ? "Free" : `₹${ev.price}`}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="reg-form">
              {!ev.isFree && (
                <div
                  className="field"
                  style={{
                    padding: "16px",
                    background: "rgba(223,166,81,0.08)",
                    border: "1px solid rgba(223,166,81,0.2)",
                    borderRadius: "4px",
                  }}
                >
                  <label
                    className="field-label font-mono"
                    style={{
                      color: "#dfa651",
                      fontSize: "0.75rem",
                      marginBottom: "8px",
                    }}
                  >
                    Payment Details
                  </label>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "rgba(245,240,232,0.8)",
                      margin: "0 0 8px 0",
                    }}
                  >
                    Registration fee: <strong>₹{ev.price}</strong>
                  </p>
                  <p
                    style={{
                      fontSize: "0.7rem",
                      color: "rgba(245,240,232,0.5)",
                      lineHeight: 1.4,
                      margin: 0,
                    }}
                  >
                    After confirming your registration, you will be redirected
                    to your dashboard to complete the payment via UPI and upload
                    a screenshot for verification.
                  </p>
                </div>
              )}
              <div className="field">
                <label className="field-label font-mono">
                  Project / Submission (Optional)
                </label>
                <div className="radio-group">
                  <label
                    className={`radio-option${submissionType === "none" ? " selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="sub"
                      value="none"
                      checked={submissionType === "none"}
                      onChange={() => setSubmissionType("none")}
                    />
                    <span className="radio-label font-mono">No submission</span>
                  </label>
                  <label
                    className={`radio-option${submissionType === "gdrive_link" ? " selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="sub"
                      value="gdrive_link"
                      checked={submissionType === "gdrive_link"}
                      onChange={() => setSubmissionType("gdrive_link")}
                    />
                    <span className="radio-label font-mono">
                      Google Drive / Cloud Link
                    </span>
                    <span className="radio-desc">
                      Share a link to your project folder or file
                    </span>
                  </label>
                </div>
              </div>

              {submissionType === "gdrive_link" && (
                <div className="field">
                  <label className="field-label font-mono">
                    Drive / Cloud Link
                  </label>
                  <input
                    className="sharp-input"
                    type="url"
                    value={gdriveLink}
                    onChange={(e) => setGdriveLink(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    required
                  />
                  <p className="field-hint font-mono">
                    Make sure the link is set to "Anyone with the link can view"
                  </p>
                </div>
              )}

              <div className="field">
                <label className="field-label font-mono">
                  Notes (Optional)
                </label>
                <textarea
                  className="sharp-input"
                  rows={3}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Any additional info about your project or attendance…"
                  style={{ resize: "vertical" }}
                />
              </div>

              {error && <p className="reg-error font-mono">{error}</p>}

              <div className="reg-actions">
                <button className="btn-outline" type="button" onClick={onClose}>
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Registering…" : "Confirm Registration →"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      <style>{`
        .modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 20px; overflow-y: auto; }
        .reg-modal { background: #111; width: 100%; max-width: 520px; padding: 40px; position: relative; max-height: 90vh; overflow-y: auto; }
        .modal-close { position: absolute; top: 16px; right: 16px; background: none; border: none; color: rgba(245,240,232,0.4); cursor: pointer; font-size: 0.75rem; }
        .modal-close:hover { color: #cb1b3a; }
        .reg-header { margin-bottom: 28px; }
        .reg-title { font-size: 1.8rem; letter-spacing: 0.04em; color: #f5f0e8; line-height: 1; margin-bottom: 10px; }
        .reg-subtitle { color: rgba(245,240,232,0.6); font-size: 0.9rem; margin-bottom: 8px; }
        .reg-subtitle-secondary { color: rgba(223,166,81,0.8); font-size: 0.85rem; margin-bottom: 20px; font-weight: 500; letter-spacing: 0.02em; }
        .reg-meta { display: flex; gap: 8px; align-items: center; font-size: 0.62rem; letter-spacing: 0.08em; color: rgba(245,240,232,0.4); flex-wrap: wrap; }
        .meta-sep { color: rgba(255,255,255,0.15); }
        .reg-form { display: flex; flex-direction: column; gap: 20px; }
        .field { display: flex; flex-direction: column; gap: 8px; }
        .field-label { font-size: 0.6rem; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(245,240,232,0.4); }
        .field-hint { font-size: 0.58rem; letter-spacing: 0.06em; color: rgba(245,240,232,0.3); margin-top: 4px; }
        .radio-group { display: flex; flex-direction: column; gap: 8px; }
        .radio-option { display: flex; flex-direction: column; gap: 2px; padding: 14px 16px; cursor: pointer; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); clip-path: polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); transition: border-color 0.2s, background 0.2s; }
        .radio-option input { display: none; }
        .radio-option.selected { border-color: rgba(34,109,11,0.5); background: rgba(34,109,11,0.08); }
        .radio-label { font-size: 0.75rem; letter-spacing: 0.08em; text-transform: uppercase; color: #f5f0e8; }
        .radio-desc { font-size: 0.72rem; color: rgba(245,240,232,0.4); }
        .reg-error { color: #cb1b3a; font-size: 0.72rem; padding: 10px 14px; background: rgba(203,27,58,0.1); border: 1px solid rgba(203,27,58,0.3); }
        .reg-actions { display: flex; gap: 12px; justify-content: flex-end; flex-wrap: wrap; padding-top: 8px; }
        .reg-success { text-align: center; padding: 20px 0; }
        .success-icon { font-size: 3rem; color: #226d0b; margin-bottom: 16px; }
        .entry-code-wrap { margin: 28px 0; padding: 24px; background: #000; border-radius: 8px; }
        .entry-label { font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 10px; }
        .entry-code { font-size: 1.8rem; font-weight: bold; letter-spacing: 0.15em; color: #fff; }
        .entry-hint { font-size: 0.62rem; letter-spacing: 0.08em; color: rgba(255,255,255,0.3); margin-top: 10px; }
        .verification-notice { margin: 28px 0; padding: 20px; border: 1px solid rgba(223,166,81,0.3); background: rgba(223,166,81,0.08); border-radius: 4px; }
        .notice-header { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; color: #dfa651; margin-bottom: 14px; font-weight: 600; }
        .notice-content { display: flex; flex-direction: column; gap: 10px; }
        .notice-text { font-size: 0.7rem; letter-spacing: 0.05em; color: rgba(223,166,81,0.9); line-height: 1.5; }
        .notice-timeline { font-size: 0.65rem; color: rgba(223,166,81,0.6); margin-top: 6px; }
        .pending-dot { width: 6px; height: 6px; border-radius: 50%; background: #dfa651; flex-shrink: 0; }
      `}</style>
    </div>
  );
}

export default withConvexProvider(EventRegisterModal);
