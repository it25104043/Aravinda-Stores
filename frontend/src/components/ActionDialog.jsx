import React, { useState } from "react";
import Modal from "./Modal";

// Keep the action form mounted only while open, so stale inputs cannot carry over.
export default function ActionDialog({ label, children, className = "" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && (
        <Modal label={label} onClose={() => setOpen(false)}>
          {children(() => setOpen(false))}
        </Modal>
      )}
    </>
  );
}
