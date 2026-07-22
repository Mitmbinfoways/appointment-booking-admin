"use client";

import React, { useEffect } from "react";
import { X, ExternalLink, Download } from "lucide-react";

export default function FileViewModal({ isOpen, onClose, fileUrl, fileType = "image", title = "Media Preview" }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !fileUrl) return null;

  const isImage = fileType === "image" || (typeof fileUrl === "string" && (fileUrl.startsWith("data:image/") || fileUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)));
  const isVideo = fileType === "video" || (typeof fileUrl === "string" && (fileUrl.startsWith("data:video/") || fileUrl.match(/\.(mp4|webm|ogg|mov)$/i)));

  const handleDownload = () => {
    if (!fileUrl) return;
    try {
      const link = document.createElement("a");
      link.href = fileUrl;

      let extension = "png";
      if (isImage) {
        if (fileUrl.startsWith("data:image/jpeg")) extension = "jpg";
        else if (fileUrl.startsWith("data:image/gif")) extension = "gif";
        else if (fileUrl.startsWith("data:image/webp")) extension = "webp";
        else if (fileUrl.startsWith("data:image/png")) extension = "png";
      } else if (isVideo) {
        extension = "mp4";
        if (fileUrl.startsWith("data:video/webm")) extension = "webm";
      }

      const sanitizedTitle = (title || "download-file").toLowerCase().replace(/[^a-z0-9]/g, "-");
      link.download = `${sanitizedTitle}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error downloading file:", err);
    }
  };

  const handleOpenNewTab = () => {
    if (!fileUrl) return;
    try {
      if (fileUrl.startsWith("data:")) {
        const win = window.open("");
        if (win) {
          win.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${title || "Media View"}</title>
                <style>
                  body {
                    margin: 0;
                    background-color: #f8fafc;
                    color: #0f172a;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    font-family: system-ui, -apple-system, sans-serif;
                  }
                  img, video {
                    max-width: 95vw;
                    max-height: 95vh;
                    object-fit: contain;
                    border-radius: 12px;
                    background-color: #ffffff;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
                  }
                  @media (prefers-color-scheme: dark) {
                    body {
                      background-color: #0f172a;
                      color: #f8fafc;
                    }
                    img, video {
                      background-color: #1e293b;
                      border-color: #334155;
                      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    }
                  }
                </style>
              </head>
              <body>
                ${isVideo
              ? `<video src="${fileUrl}" controls autoplay></video>`
              : `<img src="${fileUrl}" alt="${title || "Media View"}" />`
            }
              </body>
            </html>
          `);
          win.document.close();
        }
      } else {
        window.open(fileUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("Error opening in new tab:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/20 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Light Mode Modal Card */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/80 shrink-0">
          <h3 className="text-sm font-bold text-gray-800 truncate pr-4">
            {title || "Media Preview"}
          </h3>
          <div className="flex items-center gap-1.5">
            {fileUrl && (
              <>
                {/* Download Button */}
                <button
                  type="button"
                  onClick={handleDownload}
                  className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200/70 rounded-lg transition-colors cursor-pointer"
                  title="Download File"
                >
                  <Download size={18} />
                </button>
                {/* Open in New Tab Button */}
                <button
                  type="button"
                  onClick={handleOpenNewTab}
                  className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200/70 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                  title="Open in New Tab"
                >
                  <ExternalLink size={18} />
                </button>
              </>
            )}
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200/70 rounded-lg transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50 min-h-[300px]">
          {isImage ? (
            <img
              src={fileUrl}
              alt={title || "Preview Image"}
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-md border border-gray-200 bg-white"
            />
          ) : isVideo ? (
            <video
              src={fileUrl}
              className="max-w-full max-h-[75vh] rounded-xl shadow-md border border-gray-200 bg-black"
              controls
            />
          ) : (
            <div className="text-gray-400 text-sm py-12">Preview not available for this file type.</div>
          )}
        </div>
      </div>
    </div>
  );
}
