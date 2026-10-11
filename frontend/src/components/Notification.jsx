import Modal from "./Modal";
import React from "react";

// Toast Notification Banner
export function Toast({ message, type = "info", onClose }) {
  if (!message) return null;
  return (
    <div className={`toast-banner toast-${type}`}>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose}>
        ×
      </button>
    </div>
  );
}

// Confirmation Dialog Modal
export function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
}) {
  if (!isOpen) return null;
  return (
    <Modal label={title || "Confirmation"} onClose={onCancel}>
      <h3>{title || "Confirmation"}</h3>
      <p className="confirm-modal-body">{message}</p>
      <div className="confirm-modal-actions">
        <button onClick={onCancel}>{cancelText}</button>
        <button className="primary danger-btn" onClick={onConfirm}>
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
