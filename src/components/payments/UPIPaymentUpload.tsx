import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface UPIPaymentUploadProps {
  registrationId: Id<"registrations">;
  sessionToken: string;
  amount: number;
  onSuccess?: () => void;
}

const PAYMENT_UPI_ID = "9454288772@upi";

export function UPIPaymentUpload({
  registrationId,
  sessionToken,
  amount,
  onSuccess,
}: UPIPaymentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.registrations.generateUploadUrl);
  const uploadPaymentProof = useMutation(api.registrations.uploadPaymentProof);

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          const maxDim = 1920;
          if (width > maxDim || height > maxDim) {
            const ratio = Math.min(maxDim / width, maxDim / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.8);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setError("");
    setSuccess("");
    setUploading(true);

    try {
      const compressed = await compressImage(selectedFile);

      if (compressed.size > 3 * 1024 * 1024) {
        setError(
          "Compressed image is still over 3MB. Please use a smaller image.",
        );
        setUploading(false);
        return;
      }

      const uploadUrlRes = await generateUploadUrl({ sessionToken });
      if (!uploadUrlRes.success) {
        throw new Error("Failed to generate upload URL");
      }

      const uploadRes = await fetch(uploadUrlRes.url, {
        method: "POST",
        headers: {
          "Content-Type": "image/jpeg",
        },
        body: compressed,
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        console.error("Upload failed with status", uploadRes.status, errorText);
        throw new Error(
          `Upload failed: ${uploadRes.status} ${uploadRes.statusText}`,
        );
      }

      const responseText = await uploadRes.text().catch((err) => {
        console.error("Failed to read upload response:", err);
        throw err;
      });

      let storageId: string;
      try {
        const parsed = JSON.parse(responseText);
        storageId = typeof parsed === "string" ? parsed : parsed.storageId;
      } catch (parseErr) {
        storageId = responseText.trim();
      }

      if (!storageId || typeof storageId !== "string") {
        console.error(
          "Invalid storage ID:",
          storageId,
          "type:",
          typeof storageId,
        );
        throw new Error("Invalid storage ID received from server");
      }

      const verifyRes = await uploadPaymentProof({
        sessionToken,
        registrationId,
        storageId: storageId as string,
      });

      if (!verifyRes.success) {
        console.error("uploadPaymentProof failed:", verifyRes.error);
        throw new Error(verifyRes.error || "Failed to submit payment proof");
      }

      setSuccess(
        verifyRes.message || "Payment proof submitted for verification!",
      );
      setSelectedFile(null);
      setPreviewUrl("");

      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        padding: "24px",
        background: "rgba(0, 0, 0, 0.3)",
        borderRadius: "4px",
        border: "1px solid rgba(223, 166, 81, 0.2)",
      }}
    >
      <h3
        style={{
          fontSize: "1.2rem",
          fontFamily: "'Syne', sans-serif",
          marginBottom: "20px",
          color: "#f5f0e8",
        }}
      >
        Complete Registration Payment
      </h3>

      <div
        style={{
          padding: "20px",
          background: "rgba(223, 166, 81, 0.1)",
          borderRadius: "8px",
          marginBottom: "24px",
          border: "1px solid rgba(223, 166, 81, 0.4)",
        }}
      >
        <h4
          style={{ color: "#dfa651", margin: "0 0 12px 0", fontSize: "1.1rem" }}
        >
          Step 1: Make Payment
        </h4>
        <p
          style={{
            fontSize: "0.85rem",
            color: "rgba(245, 240, 232, 0.8)",
            marginBottom: "16px",
            lineHeight: "1.5",
          }}
        >
          Please pay the exact amount below to our UPI ID using any UPI app
          (GPay, PhonePe, Paytm, etc.), then take a screenshot of the successful
          payment.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            background: "rgba(0,0,0,0.4)",
            padding: "16px",
            borderRadius: "6px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.7rem",
                color: "rgba(245, 240, 232, 0.5)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "4px",
              }}
            >
              Amount to Pay
            </div>
            <div
              style={{
                fontSize: "1.4rem",
                color: "#226d0b",
                fontWeight: "bold",
                fontFamily: "'Space Mono', monospace",
              }}
            >
              ₹{amount}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: "0.7rem",
                color: "rgba(245, 240, 232, 0.5)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "4px",
              }}
            >
              UPI ID
            </div>
            <div
              style={{
                fontSize: "1.2rem",
                color: "#dfa651",
                fontWeight: "bold",
                fontFamily: "'Space Mono', monospace",
                userSelect: "all",
              }}
            >
              {PAYMENT_UPI_ID}
            </div>
          </div>
        </div>
      </div>

      <h4
        style={{ color: "#dfa651", margin: "0 0 16px 0", fontSize: "1.1rem" }}
      >
        Step 2: Upload Screenshot
      </h4>

      {previewUrl && (
        <div
          style={{
            marginBottom: "16px",
            borderRadius: "4px",
            overflow: "hidden",
            border: "1px solid rgba(223, 166, 81, 0.2)",
          }}
        >
          <img
            src={previewUrl}
            alt="Payment proof preview"
            style={{
              maxWidth: "100%",
              maxHeight: "300px",
              display: "block",
              background: "#000",
            }}
          />
        </div>
      )}

      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            display: "block",
            fontSize: "0.85rem",
            color: "rgba(245, 240, 232, 0.9)",
            marginBottom: "8px",
            fontWeight: "bold",
          }}
        >
          Payment Screenshot (JPEG/PNG, under 3MB)
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="custom-file-input"
          style={{
            display: "block",
            width: "100%",
            padding: "12px",
            background: "rgba(0, 0, 0, 0.5)",
            border: "1px dashed rgba(223, 166, 81, 0.3)",
            borderRadius: "4px",
            color: "#f5f0e8",
            cursor: "pointer",
            fontSize: "0.75rem",
            boxSizing: "border-box",
          }}
        />
        <p
          style={{
            fontSize: "0.75rem",
            color: "rgba(245, 240, 232, 0.6)",
            marginTop: "8px",
          }}
        >
          Make sure the transaction ID and amount are clearly visible in the
          screenshot.
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: "12px",
            background: "rgba(203, 27, 58, 0.1)",
            border: "1px solid rgba(203, 27, 58, 0.3)",
            borderRadius: "4px",
            color: "#cb1b3a",
            fontSize: "0.75rem",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: "12px",
            background: "rgba(34, 109, 11, 0.1)",
            border: "1px solid rgba(34, 109, 11, 0.3)",
            borderRadius: "4px",
            color: "#226d0b",
            fontSize: "0.75rem",
            marginBottom: "16px",
          }}
        >
          ✓ {success}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        style={{
          width: "100%",
          padding: "12px",
          background: uploading
            ? "rgba(34, 109, 11, 0.2)"
            : "rgba(34, 109, 11, 0.3)",
          color: "#226d0b",
          border: "1px solid rgba(34, 109, 11, 0.5)",
          borderRadius: "4px",
          cursor: uploading ? "not-allowed" : "pointer",
          fontWeight: "bold",
          fontSize: "0.85rem",
          opacity: uploading ? 0.6 : 1,
          fontFamily: "'Space Mono', monospace",
        }}
      >
        {uploading ? "Uploading…" : "Submit Payment Proof →"}
      </button>

      <style>{`
        .custom-file-input::-webkit-file-upload-button {
          background: rgba(223, 166, 81, 0.2);
          border: 1px solid rgba(223, 166, 81, 0.4);
          color: #dfa651;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-family: 'Space Mono', monospace;
          font-size: 0.75rem;
          margin-right: 16px;
          transition: all 0.2s;
        }
        .custom-file-input::-webkit-file-upload-button:hover {
          background: rgba(223, 166, 81, 0.3);
        }
        .custom-file-input::file-selector-button {
          background: rgba(223, 166, 81, 0.2);
          border: 1px solid rgba(223, 166, 81, 0.4);
          color: #dfa651;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-family: 'Space Mono', monospace;
          font-size: 0.75rem;
          margin-right: 16px;
          transition: all 0.2s;
        }
        .custom-file-input::file-selector-button:hover {
          background: rgba(223, 166, 81, 0.3);
        }
      `}</style>
    </div>
  );
}
