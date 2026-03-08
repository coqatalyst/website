import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

import jsQR from "jsqr";

interface QRScannerProps {
  eventId: string;
  onVerificationSuccess?: (data: any) => void;
  onVerificationError?: (error: string) => void;
}

export function QRScanner({
  eventId,
  onVerificationSuccess,
  onVerificationError,
}: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(true);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!scanning || !videoRef.current) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Failed to access camera:", error);
        onVerificationError?.(
          "Camera access denied. Please use manual entry instead.",
        );
        setShowManualEntry(true);
        setScanning(false);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [scanning, onVerificationError]);

  useEffect(() => {
    if (!scanning || !videoRef.current || !canvasRef.current || scannedCode)
      return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scanInterval = setInterval(() => {
      if (
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
      ) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);

        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            setScannedCode(code.data);
            setScanning(false);
          }
        } catch (error) {
          console.error("QR scanning error:", error);
        }
      }
    }, 100);

    return () => clearInterval(scanInterval);
  }, [scanning, scannedCode]);

  const handleVerifyCode = async (code: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/verify-entry-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, entryCode: code }),
      });

      const result = await response.json();

      if (result.success) {
        setVerificationResult(result);
        onVerificationSuccess?.(result);
      } else {
        onVerificationError?.(result.error || "Invalid entry code");
        setVerificationResult({ success: false, error: result.error });
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Verification failed";
      onVerificationError?.(errorMsg);
      setVerificationResult({ success: false, error: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleVerifyCode(manualCode.trim());
      setManualCode("");
    }
  };

  if (verificationResult) {
    return (
      <div className="verification-result">
        {verificationResult.success ? (
          <div className="result-success">
            <div className="result-icon">✓</div>
            <h3 className="result-title">Entry Code Valid</h3>
            <div className="result-details">
              <p className="detail-row">
                <span className="detail-label">Name:</span>
                <span className="detail-value">
                  {verificationResult.user?.name}
                </span>
              </p>
              <p className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">
                  {verificationResult.user?.email}
                </span>
              </p>
              <p className="detail-row">
                <span className="detail-label">Event:</span>
                <span className="detail-value">
                  {verificationResult.event?.title}
                </span>
              </p>
            </div>
            <button
              className="btn-primary"
              onClick={() => {
                setVerificationResult(null);
                setScannedCode(null);
                setScanning(true);
              }}
            >
              Scan Next
            </button>
          </div>
        ) : (
          <div className="result-error">
            <div className="result-icon">✕</div>
            <h3 className="result-title">Invalid Code</h3>
            <p className="result-message">{verificationResult.error}</p>
            <button
              className="btn-outline"
              onClick={() => {
                setVerificationResult(null);
                setScannedCode(null);
                setScanning(true);
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="qr-scanner-container">
      {scanning && !scannedCode && (
        <div className="scanner-wrapper">
          <video
            ref={videoRef}
            className="scanner-video"
            autoPlay
            playsInline
          />
          <canvas ref={canvasRef} className="scanner-canvas" />
          <div className="scanner-overlay">
            <div className="scanner-frame" />
            <p className="scanner-text">Point camera at QR code</p>
          </div>
        </div>
      )}

      {!scanning && scannedCode && !verificationResult && (
        <div className="scanned-code-display">
          <p className="scanned-label">Scanned Code:</p>
          <p className="scanned-code font-mono">{scannedCode}</p>
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner" />
              <p>Verifying...</p>
            </div>
          ) : (
            <>
              <button
                className="btn-primary"
                onClick={() => handleVerifyCode(scannedCode)}
              >
                Verify Code
              </button>
              <button
                className="btn-outline"
                onClick={() => {
                  setScannedCode(null);
                  setScanning(true);
                }}
              >
                Scan Again
              </button>
            </>
          )}
        </div>
      )}

      <div className="manual-entry-section">
        <button
          className="toggle-manual-entry"
          onClick={() => setShowManualEntry(!showManualEntry)}
        >
          {showManualEntry ? "Hide" : "Enter Code Manually"}
        </button>

        {showManualEntry && (
          <form onSubmit={handleManualSubmit} className="manual-entry-form">
            <input
              type="text"
              className="sharp-input"
              placeholder="Enter entry code (e.g., ABC1-DEF2-GHI3-JKL4)"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              maxLength={20}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={!manualCode.trim() || loading}
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
          </form>
        )}
      </div>

      <style>{`
        .qr-scanner-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding: 24px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
        }

        .scanner-wrapper {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          background: #000;
          border-radius: 8px;
          overflow: hidden;
        }

        .scanner-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .scanner-canvas {
          display: none;
        }

        .scanner-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .scanner-frame {
          width: 70%;
          aspect-ratio: 1;
          border: 3px solid rgba(34, 109, 11, 0.8);
          border-radius: 8px;
          box-shadow: 0 0 0 2000px rgba(0, 0, 0, 0.5);
        }

        .scanner-text {
          position: absolute;
          bottom: 20px;
          color: #f5f0e8;
          font-size: 0.9rem;
          text-align: center;
          font-family: "Space Mono", monospace;
        }

        .scanned-code-display {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 20px;
          background: rgba(34, 109, 11, 0.08);
          border: 1px solid rgba(34, 109, 11, 0.2);
          border-radius: 8px;
          text-align: center;
        }

        .scanned-label {
          font-size: 0.75rem;
          color: rgba(245, 240, 232, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 0;
        }

        .scanned-code {
          font-size: 1.1rem;
          color: #226d0b;
          margin: 0;
          word-break: break-all;
        }

        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 20px;
        }

        .spinner {
          width: 32px;
          height: 32px;
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

        .verification-result {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 300px;
        }

        .result-success,
        .result-error {
          text-align: center;
          padding: 32px 24px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: center;
        }

        .result-success {
          background: rgba(34, 109, 11, 0.1);
          border: 1px solid rgba(34, 109, 11, 0.3);
        }

        .result-error {
          background: rgba(203, 27, 58, 0.1);
          border: 1px solid rgba(203, 27, 58, 0.3);
        }

        .result-icon {
          font-size: 3rem;
          font-weight: bold;
        }

        .result-success .result-icon {
          color: #226d0b;
        }

        .result-error .result-icon {
          color: #cb1b3a;
        }

        .result-title {
          font-size: 1.5rem;
          color: #f5f0e8;
          margin: 0;
          font-family: "Bebas Neue", sans-serif;
        }

        .result-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: left;
          background: rgba(0, 0, 0, 0.2);
          padding: 16px;
          border-radius: 4px;
          width: 100%;
          max-width: 400px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 0.9rem;
          margin: 0;
        }

        .detail-label {
          color: rgba(245, 240, 232, 0.5);
          font-weight: 600;
        }

        .detail-value {
          color: #f5f0e8;
          word-break: break-word;
        }

        .result-message {
          font-size: 0.95rem;
          color: rgba(245, 240, 232, 0.7);
          margin: 0;
        }

        .manual-entry-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .toggle-manual-entry {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #226d0b;
          padding: 10px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
          font-family: "Space Mono", monospace;
        }

        .toggle-manual-entry:hover {
          background: rgba(34, 109, 11, 0.1);
          border-color: rgba(34, 109, 11, 0.3);
        }

        .manual-entry-form {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .manual-entry-form input {
          flex: 1;
          min-width: 250px;
        }

        .manual-entry-form button {
          flex-shrink: 0;
        }

        @media (max-width: 600px) {
          .qr-scanner-container {
            padding: 16px;
          }

          .scanner-wrapper {
            max-height: 400px;
          }

          .result-details {
            max-width: 100%;
          }

          .manual-entry-form {
            flex-direction: column;
          }

          .manual-entry-form input {
            min-width: unset;
          }
        }
      `}</style>
    </div>
  );
}

export default QRScanner;
