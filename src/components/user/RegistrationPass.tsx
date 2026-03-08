import React, { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

import QRCode from "qrcode";

interface RegistrationPassProps {
  registrationId: Id<"registrations">;
  sessionToken: string;
}

export function RegistrationPass({
  registrationId,
  sessionToken,
}: RegistrationPassProps) {
  const registration = useQuery(api.registrations.getRegistration, {
    sessionToken,
    registrationId,
  });

  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    if (registration && registration.entryCode) {
      QRCode.toDataURL(registration.entryCode)
        .then((url) => setQrCode(url))
        .catch((err) => console.error("Failed to generate QR code:", err));
    }
  }, [registration?.entryCode]);

  if (registration === undefined) {
    return (
      <div className="pass-loading">
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
        <p>Loading registration details...</p>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="pass-error">
        <p>Registration not found</p>
      </div>
    );
  }

  const handleCopyCode = () => {
    if (registration.entryCode) {
      navigator.clipboard.writeText(registration.entryCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
      case "free":
        return "#226d0b";
      case "pending":
        return "#dfa651";
      default:
        return "#f5f0e8";
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "Payment Complete";
      case "free":
        return "Free Event";
      case "pending":
        return "Payment Pending";
      default:
        return status;
    }
  };

  return (
    <div className="registration-pass">
      <div className="pass-card sharp-card">
        {/* Header */}
        <div className="pass-header">
          <h2 className="font-display pass-title">Event Pass</h2>
          <span
            className="pass-status font-mono"
            style={{
              color: getPaymentStatusColor(registration.paymentStatus),
            }}
          >
            {getPaymentStatusLabel(registration.paymentStatus)}
          </span>
        </div>

        {/* Event Info */}
        <div className="pass-event-info">
          <h3 className="event-name font-display">
            {registration.event?.title}
          </h3>
          <div className="event-meta">
            <div className="meta-row">
              <span className="meta-label font-mono">Date</span>
              <span className="meta-value">{registration.event?.date}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label font-mono">Location</span>
              <span className="meta-value">{registration.event?.location}</span>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        {registration.passGenerated && (
          <div className="pass-qr-section">
            {qrCode && (
              <div className="qr-container">
                <img src={qrCode} alt="Entry QR Code" className="qr-code" />
                <p className="qr-label font-mono">Scan at check-in</p>
              </div>
            )}

            {/* Entry Code Display */}
            <div className="entry-code-section">
              <button
                className="code-toggle font-mono"
                onClick={() => setShowCode(!showCode)}
              >
                {showCode ? "Hide" : "Show"} Entry Code
              </button>

              {showCode && registration.entryCode && (
                <div className="code-display">
                  <code className="entry-code">{registration.entryCode}</code>
                  <button
                    className="copy-button font-mono"
                    onClick={handleCopyCode}
                    title="Copy to clipboard"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              )}

              <p className="code-hint font-mono">
                Use the entry code if QR scanning isn't available
              </p>
            </div>
          </div>
        )}

        {/* Payment Pending Message */}
        {registration.paymentStatus === "pending" && (
          <div className="pending-message">
            <p>
              Your registration is pending payment. Complete payment to receive
              your entry code.
            </p>
          </div>
        )}

        {/* Registration Details */}
        <div className="pass-details">
          <div className="detail-item">
            <span className="detail-label font-mono">Registered</span>
            <span className="detail-value">
              {new Date(registration.createdAt).toLocaleDateString()}
            </span>
          </div>

          {registration.paymentStatus !== "pending" && (
            <div className="detail-item">
              <span className="detail-label font-mono">Confirmed</span>
              <span className="detail-value">
                {registration.paidAt
                  ? new Date(registration.paidAt).toLocaleDateString()
                  : "—"}
              </span>
            </div>
          )}

          {registration.amount > 0 && (
            <div className="detail-item">
              <span className="detail-label font-mono">Amount</span>
              <span className="detail-value">₹{registration.amount}</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .registration-pass {
          width: 100%;
          max-width: 500px;
          margin: 0 auto;
        }

        .pass-card {
          background: linear-gradient(135deg, rgba(34, 109, 11, 0.08), rgba(34, 109, 11, 0.03));
          border: 1px solid rgba(34, 109, 11, 0.15);
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .pass-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(34, 109, 11, 0.2);
        }

        .pass-title {
          font-size: 1.8rem;
          color: #f5f0e8;
          margin: 0;
          letter-spacing: 0.02em;
        }

        .pass-status {
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 6px 12px;
          background: rgba(34, 109, 11, 0.1);
          border: 1px solid rgba(34, 109, 11, 0.2);
          border-radius: 4px;
          white-space: nowrap;
        }

        .pass-event-info {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .event-name {
          font-size: 1.4rem;
          color: #f5f0e8;
          margin: 0;
          line-height: 1.2;
        }

        .event-meta {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .meta-row {
          display: flex;
          gap: 12px;
          font-size: 0.9rem;
        }

        .meta-label {
          color: rgba(245, 240, 232, 0.4);
          font-weight: 600;
          min-width: 70px;
        }

        .meta-value {
          color: rgba(245, 240, 232, 0.8);
        }

        .pass-qr-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
          align-items: center;
          padding: 24px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
        }

        .qr-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .qr-code {
          width: 200px;
          height: 200px;
          background: #f5f0e8;
          padding: 8px;
          border-radius: 4px;
        }

        .qr-label {
          font-size: 0.7rem;
          color: rgba(245, 240, 232, 0.5);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin: 0;
        }

        .entry-code-section {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .code-toggle {
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #226d0b;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s;
        }

        .code-toggle:hover {
          background: rgba(34, 109, 11, 0.1);
          border-color: rgba(34, 109, 11, 0.3);
        }

        .code-display {
          display: flex;
          gap: 8px;
          padding: 12px;
          background: rgba(34, 109, 11, 0.15);
          border: 1px solid rgba(34, 109, 11, 0.3);
          border-radius: 4px;
        }

        .entry-code {
          flex: 1;
          font-family: "Space Mono", monospace;
          font-size: 1rem;
          color: #226d0b;
          margin: 0;
          word-break: break-all;
        }

        .copy-button {
          padding: 8px 12px;
          background: #226d0b;
          color: #f5f0e8;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.75rem;
          transition: all 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .copy-button:hover {
          background: rgba(34, 109, 11, 0.8);
        }

        .code-hint {
          font-size: 0.7rem;
          color: rgba(245, 240, 232, 0.4);
          margin: 0;
          text-align: center;
          letter-spacing: 0.05em;
        }

        .pending-message {
          padding: 16px;
          background: rgba(223, 166, 81, 0.1);
          border: 1px solid rgba(223, 166, 81, 0.2);
          border-radius: 4px;
          color: rgba(245, 240, 232, 0.8);
          font-size: 0.9rem;
          line-height: 1.6;
        }

        .pending-message p {
          margin: 0;
        }

        .pass-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(34, 109, 11, 0.2);
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-label {
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(245, 240, 232, 0.4);
        }

        .detail-value {
          font-size: 0.95rem;
          color: #f5f0e8;
          font-weight: 500;
        }

        .pass-loading,
        .pass-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 24px;
          text-align: center;
          gap: 16px;
          min-height: 400px;
        }

        .loading-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(34, 109, 11, 0.2);
          border-top-color: #226d0b;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .pass-error p {
          color: rgba(245, 240, 232, 0.6);
          font-size: 0.95rem;
          margin: 0;
        }

        @media (max-width: 600px) {
          .pass-card {
            padding: 24px;
            gap: 20px;
          }

          .pass-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .pass-title {
            font-size: 1.5rem;
          }

          .event-name {
            font-size: 1.2rem;
          }

          .qr-code {
            width: 150px;
            height: 150px;
          }

          .pass-details {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default RegistrationPass;
