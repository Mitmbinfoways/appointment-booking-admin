"use client";

import React, { useRef, useEffect } from "react";
import Button from "./Button";

export const CustomModal = ({
  children,
  className = "",
  showCloseButton = true,
  isFullscreen = false,
  onClose,
  isOpen,
  maxWidth = "max-w-[700px]",
}) => {
  const modalRef = useRef(null);

  // Close handler
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const contentClasses = isFullscreen
    ? "w-full h-full"
    : `relative w-full ${maxWidth} mx-4 rounded-lg border border-gray-200 bg-white transition-all duration-300 ease-in-out`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto">
      {!isFullscreen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        ></div>
      )}
      <div
        ref={modalRef}
        className={`${contentClasses} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 sm:right-6 sm:top-6"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z"
                fill="currentColor"
              />
            </svg>
          </button>
        )}
        <div className="p-4 lg:p-6">{children}</div>
      </div>
    </div>
  );
};

export const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Delete",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  itemName = "",
  loading = false,
  confirmButtonText = "Delete",
  loadingButtonText = "Deleting...",
}) => {
  return (
    <CustomModal isOpen={isOpen} onClose={onClose} showCloseButton={true}>
      <div className="w-full">
        <h4 className="mb-2 text-xl font-semibold text-gray-800 md:text-2xl">
          {title}
        </h4>
        <p className="mb-6 text-sm text-gray-500">
          {message}
          {itemName && (
            <span className="font-medium text-gray-700"> {itemName}</span>
          )}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={onConfirm}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? loadingButtonText : confirmButtonText}
          </Button>
        </div>
      </div>
    </CustomModal>
  );
};

export default CustomModal;
