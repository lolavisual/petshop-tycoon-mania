import { ReactNode, useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalPortalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  zIndex?: number;
  testId?: string;
  backdropClassName?: string;
  closeOnBackdropClick?: boolean;
  /** Aria label for screen readers */
  ariaLabel?: string;
  /** Aria description for screen readers */
  ariaDescription?: string;
  /** Initial focus element ref (defaults to first focusable element) */
  initialFocusRef?: React.RefObject<HTMLElement>;
}

/**
 * Universal Modal Portal component that renders modals at the top of the DOM
 * to avoid z-index and stacking context issues in complex UIs (especially Telegram WebView).
 * 
 * Features:
 * - Renders via React Portal to document.body
 * - High z-index (300+ by default) to stay above all game layers
 * - Uses onPointerDown for reliable touch/click handling
 * - Proper accessibility: role, aria-modal, focus trap, keyboard navigation
 * - Screen reader announcements via aria-live
 * - AnimatePresence for smooth enter/exit animations
 * - Escape key to close
 */
export function ModalPortal({
  isOpen,
  onClose,
  children,
  zIndex = 300,
  testId,
  backdropClassName = 'bg-black/70 backdrop-blur-sm',
  closeOnBackdropClick = true,
  ariaLabel,
  ariaDescription,
  initialFocusRef,
}: ModalPortalProps) {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Save and restore focus when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Focus initial element or first focusable element
      requestAnimationFrame(() => {
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus();
        } else if (modalRef.current) {
          const firstFocusable = getFocusableElements(modalRef.current)[0];
          if (firstFocusable) {
            firstFocusable.focus();
          } else {
            modalRef.current.focus();
          }
        }
      });
    } else {
      // Restore focus when closing
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }
  }, [isOpen, initialFocusRef]);

  // Keyboard navigation: Escape to close, Tab trap
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    // Escape to close
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
      return;
    }

    // Tab trap - keep focus within modal
    if (e.key === 'Tab' && modalRef.current) {
      const focusableElements = getFocusableElements(modalRef.current);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: going backwards
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: going forwards
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  if (!portalTarget) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Screen reader announcement */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {ariaLabel || 'Диалоговое окно открыто'}
          </div>
          
          <motion.div
            ref={modalRef}
            className="fixed inset-0 flex items-center justify-center p-4 pointer-events-auto"
            style={{ zIndex }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-testid={testId}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            aria-describedby={ariaDescription ? `${testId}-description` : undefined}
            tabIndex={-1}
          >
            {/* Hidden description for screen readers */}
            {ariaDescription && (
              <div id={`${testId}-description`} className="sr-only">
                {ariaDescription}
              </div>
            )}
            
            {/* Backdrop */}
            <motion.div
              className={`absolute inset-0 ${backdropClassName} pointer-events-auto`}
              data-testid={testId ? `${testId}-backdrop` : undefined}
              onPointerDown={(e) => {
                if (closeOnBackdropClick) {
                  e.preventDefault();
                  onClose();
                }
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-hidden="true"
            />

            {/* Content wrapper - stops propagation to prevent backdrop close */}
            <motion.div
              className="relative pointer-events-auto"
              onPointerDown={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {children}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalTarget
  );
}

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
}

export default ModalPortal;
