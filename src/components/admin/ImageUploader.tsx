import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface ImageUploaderProps {
  sessionToken: string;
  onImageUpload: (storageId: string, url: string) => void;
  imageType: "event_cover" | "event_gallery" | "blog_cover";
  label: string;
}

export function ImageUploader({
  sessionToken,
  onImageUpload,
  imageType,
  label,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  const getUploadMutation = () => {
    if (imageType === "event_cover") {
      return api.events.generateEventCoverImageUploadUrl;
    } else if (imageType === "event_gallery") {
      return api.events.generateEventGalleryImageUploadUrl;
    } else {
      return api.blogs.generateBlogImageUploadUrl;
    }
  };

  const generateUploadUrl = useMutation(getUploadMutation());

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const urlResponse = await generateUploadUrl({ sessionToken });

      if (!urlResponse.success) {
        setError("Failed to get upload URL");
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch(urlResponse.url, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        setError("Upload failed");
        setUploading(false);
        return;
      }

      const storageId = await uploadResponse.text();

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setPreview(dataUrl);
      };
      reader.readAsDataURL(file);

      onImageUpload(storageId, "");
      setUploading(false);
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        err instanceof Error ? err.message : "An error occurred during upload",
      );
      setUploading(false);
    }
  };

  return (
    <div className="image-uploader">
      <label className="uploader-label">{label}</label>

      <div className="uploader-input-wrapper">
        <input
          type="file"
          id={`file-input-${imageType}`}
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="uploader-input"
        />
        <label htmlFor={`file-input-${imageType}`} className="uploader-button">
          {uploading ? "Uploading..." : "Choose Image"}
        </label>
      </div>

      {preview && (
        <div className="uploader-preview">
          <img src={preview} alt="Preview" className="preview-image" />
          <p className="preview-text">Ready to upload</p>
        </div>
      )}

      {error && <div className="uploader-error">{error}</div>}

      <style>{`
        .image-uploader {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .uploader-label {
          font-size: 0.75rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(245, 240, 232, 0.6);
          font-family: "Space Mono", monospace;
        }

        .uploader-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .uploader-input {
          display: none;
        }

        .uploader-button {
          padding: 12px 16px;
          background: rgba(34, 109, 11, 0.1);
          border: 1px solid rgba(34, 109, 11, 0.3);
          border-radius: 4px;
          color: #226d0b;
          cursor: pointer;
          font-family: "Space Mono", monospace;
          font-size: 0.85rem;
          transition: all 0.2s;
          text-align: center;
        }

        .uploader-button:hover {
          background: rgba(34, 109, 11, 0.15);
          border-color: rgba(34, 109, 11, 0.5);
        }

        .uploader-input:disabled ~ .uploader-button {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .uploader-preview {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
          padding: 12px;
          background: rgba(34, 109, 11, 0.08);
          border: 1px solid rgba(34, 109, 11, 0.2);
          border-radius: 4px;
        }

        .preview-image {
          max-width: 100%;
          max-height: 150px;
          border-radius: 4px;
        }

        .preview-text {
          font-size: 0.75rem;
          color: #226d0b;
          margin: 0;
          font-family: "Space Mono", monospace;
        }

        .uploader-error {
          padding: 8px 12px;
          background: rgba(203, 27, 58, 0.1);
          border: 1px solid rgba(203, 27, 58, 0.3);
          border-radius: 4px;
          color: #cb1b3a;
          font-size: 0.85rem;
          font-family: "Space Mono", monospace;
        }
      `}</style>
    </div>
  );
}

export default ImageUploader;
