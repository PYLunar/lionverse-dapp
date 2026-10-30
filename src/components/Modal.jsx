import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function Modal({ children, close, title, busy }) {
  const root = useRef(null);
  const onClose = useRef(close);
  onClose.current = close;
  useEffect(() => {
    const previous = document.activeElement;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    root.current?.focus();
    return () => {
      document.body.style.overflow = priorOverflow;
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose.current();
      }}
    >
      <section
        className="modal"
        ref={root}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === "Escape" && !busy) onClose.current();
          if (e.key !== "Tab") return;
          const controls = [
            ...root.current.querySelectorAll(
              "button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]",
            ),
          ];
          const first = controls[0],
            last = controls.at(-1);
          if (!controls.length) {
            e.preventDefault();
            return;
          }
          if (
            e.shiftKey &&
            (document.activeElement === first || document.activeElement === root.current)
          ) {
            e.preventDefault();
            last.focus();
          } else if (
            !e.shiftKey &&
            (document.activeElement === last || document.activeElement === root.current)
          ) {
            e.preventDefault();
            first.focus();
          }
        }}
      >
        <button
          className="icon-button modal-close"
          aria-label="Close dialog"
          onClick={close}
          disabled={busy}
        >
          <X size={20} />
        </button>
        {children}
      </section>
    </div>
  );
}
