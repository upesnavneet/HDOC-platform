import { useEffect, useRef, useId } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = 'coord-profile-card',
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  useFocusTrap(dialogRef, isOpen);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="coord-profile-modal"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={className}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="coord-close-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          ×
        </button>
        {title && (
          <h2 id={titleId} className="modal-title">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
