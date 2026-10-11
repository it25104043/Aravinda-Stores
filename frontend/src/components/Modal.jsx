import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
export default function Modal({
  label,
  className = "",
  onClose,
  busy = false,
  children,
}) {
  const [container] = useState(() => document.createElement("div"));
  const [formBusy, setFormBusy] = useState(false);
  const dialog = useRef(null),
    close = useRef(onClose),
    pending = useRef(busy);
  close.current = onClose;
  pending.current = busy;
  const isBusy = () =>
    pending.current ||
    Boolean(dialog.current?.querySelector('[aria-busy="true"]'));
  useEffect(() => {
    const previous = document.activeElement,
      oldOverflow = document.body.style.overflow;
    document.body.appendChild(container);
    const siblings = [...document.body.children].filter(
      (node) => node !== container,
    );
    const inert = siblings.map((node) => node.inert);
    siblings.forEach((node) => {
      node.inert = true;
    });
    document.body.style.overflow = "hidden";
    dialog.current.focus();
    const observer = new MutationObserver(() =>
      setFormBusy(Boolean(dialog.current?.querySelector('[aria-busy="true"]'))),
    );
    observer.observe(dialog.current, {
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-busy"],
      childList: true,
    });
    function keyboard(event) {
      if (container.inert) return;
      if (event.key === "Escape") {
        event.preventDefault();
        if (!isBusy()) close.current();
      }
      if (event.key !== "Tab") return;
      const targets = [
        ...dialog.current.querySelectorAll(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
        ),
      ];
      const first = targets[0],
        last = targets[targets.length - 1];
      if (!first) {
        event.preventDefault();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !dialog.current.contains(document.activeElement) ||
          document.activeElement === dialog.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !dialog.current.contains(document.activeElement) ||
          document.activeElement === dialog.current)
      ) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", keyboard);
    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", keyboard);
      siblings.forEach((node, index) => {
        node.inert = inert[index];
      });
      container.remove();
      document.body.style.overflow = oldOverflow;
      if (previous?.isConnected) previous.focus();
      else {
        // A completed action may remove its trigger; keep focus in the remaining dialog.
        const remaining = [
          ...document.querySelectorAll('[role="dialog"]'),
        ].filter((node) => !node.closest("[inert]"));
        remaining[remaining.length - 1]?.focus();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container]);
  return createPortal(
    <div
      className="modal show"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isBusy()) onClose();
      }}
    >
      <section
        className={`modalbox ${className}`}
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        <button
          type="button"
          className="modal-close"
          aria-label={`Close ${label}`}
          disabled={busy || formBusy}
          onClick={() => {
            if (!isBusy()) onClose();
          }}
        >
          Close
        </button>
        {children}
      </section>
    </div>,
    container,
  );
}
