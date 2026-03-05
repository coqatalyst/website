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

function EventRegisterModal({ eventId, sessionToken, onClose }: Props) {
  const event = useQuery(api.events.listEvents);
  const ev = event?.find((e) => e._id === eventId);

  const registerMutation = useMutation(api.registrations.registerForEvent);

  const [paymentOption, setPaymentOption] = useState<"pay_now" | "pay_later">("pay_now");
  const [submissionType, setSubmissionType] = useState<"gdrive_link" | "none">("none");
  const [gdriveLink, setGdriveLink] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ entryCode?: string; paymentStatus?: string } | null>(null);

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
        paymentOption: ev?.isFree ? "pay_now" : paymentOption,
        submissionType,
        submissionGdriveLink: submissionType === "gdrive_link" ? gdriveLink.trim() : undefined,
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

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="reg-modal sharp-card">
        <button className="modal-close font-mono" onClick={onClose}>✕</button>

        {result ? (
          <div className="reg-success">
            <div className="success-icon font-display">✓</div>
            <h2 className="font-display reg-title" style={{ color: "#226d0b" }}>REGISTERED!</h2>
            <p className="reg-subtitle">You're in for <strong>{ev.title}</strong></p>

            {result.entryCode && (
              <div className="entry-code-wrap">
                <p className="entry-label font-mono">Your Entry Code</p>
                <div className="entry-code font-mono">{result.entryCode}</div>
                <p className="entry-hint font-mono">Save this — you'll need it at the door.</p>
              </div>
            )}

            {result.paymentStatus === "pending" && (
              <div className="pending-notice font-mono">
                <span className="pending-dot"></span>
                Payment pending — bring payment to the event.
              </div>
            )}

            <button className="btn-primary" style={{ marginTop: 24 }} onClick={onClose}>Done →</button>
          </div>
        ) : (
          <>
            <div className="reg-header">
              <div className="section-tag" style={{ marginBottom: 10 }}>Register</div>
              <h2 className="font-display reg-title">{ev.title}</h2>
              <div className="reg-meta font-mono">
                <span>{ev.date}</span>
                <span className="meta-sep">·</span>
                <span>{ev.location}</span>
                <span className="meta-sep">·</span>
                <span style={{ color: ev.isFree ? "#226d0b" : "#dfa651" }}>{ev.isFree ? "Free" : `₹${ev.price}`}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="reg-form">
              {!ev.isFree && (
                <div className="field">
                  <label className="field-label font-mono">Payment</label>
                  <div className="radio-group">
                    <label className={`radio-option${paymentOption === "pay_now" ? " selected" : ""}`}>
                      <input type="radio" name="payment" value="pay_now" checked={paymentOption === "pay_now"} onChange={() => setPaymentOption("pay_now")} />
                      <span className="radio-label font-mono">Pay Now (₹{ev.price})</span>
                      <span className="radio-desc">Confirm your spot immediately</span>
                    </label>
                    <label className={`radio-option${paymentOption === "pay_later" ? " selected" : ""}`}>
                      <input type="radio" name="payment" value="pay_later" checked={paymentOption === "pay_later"} onChange={() => setPaymentOption("pay_later")} />
                      <span className="radio-label font-mono">Pay Later</span>
                      <span className="radio-desc">Entry code issued after payment at event</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="field">
                <label className="field-label font-mono">Project / Submission (Optional)</label>
                <div className="radio-group">
                  <label className={`radio-option${submissionType === "none" ? " selected" : ""}`}>
                    <input type="radio" name="sub" value="none" checked={submissionType === "none"} onChange={() => setSubmissionType("none")} />
                    <span className="radio-label font-mono">No submission</span>
                  </label>
                  <label className={`radio-option${submissionType === "gdrive_link" ? " selected" : ""}`}>
                    <input type="radio" name="sub" value="gdrive_link" checked={submissionType === "gdrive_link"} onChange={() => setSubmissionType("gdrive_link")} />
                    <span className="radio-label font-mono">Google Drive / Cloud Link</span>
                    <span className="radio-desc">Share a link to your project folder or file</span>
                  </label>
                </div>
              </div>

              {submissionType === "gdrive_link" && (
                <div className="field">
                  <label className="field-label font-mono">Drive / Cloud Link</label>
                  <input className="sharp-input" type="url" value={gdriveLink} onChange={e => setGdriveLink(e.target.value)} placeholder="https://drive.google.com/..." required />
                  <p className="field-hint font-mono">Make sure the link is set to "Anyone with the link can view"</p>
                </div>
              )}

              <div className="field">
                <label className="field-label font-mono">Notes (Optional)</label>
                <textarea className="sharp-input" rows={3} value={submissionNotes} onChange={e => setSubmissionNotes(e.target.value)} placeholder="Any additional info about your project or attendance…" style={{ resize: "vertical" }} />
              </div>

              {error && <p className="reg-error font-mono">{error}</p>}

              <div className="reg-actions">
                <button className="btn-outline" type="button" onClick={onClose}>Cancel</button>
                <button className="btn-primary" type="submit" disabled={loading}>{loading ? "Registering…" : "Confirm Registration →"}</button>
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
        .reg-subtitle { color: rgba(245,240,232,0.6); font-size: 0.9rem; margin-bottom: 16px; }
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
        .pending-notice { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border: 1px solid rgba(223,166,81,0.3); background: rgba(223,166,81,0.08); font-size: 0.68rem; letter-spacing: 0.08em; color: #dfa651; }
        .pending-dot { width: 6px; height: 6px; border-radius: 50%; background: #dfa651; flex-shrink: 0; }
      `}</style>
    </div>
  );
}

export default withConvexProvider(EventRegisterModal);
