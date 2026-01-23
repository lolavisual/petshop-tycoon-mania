import { ReactNode, useEffect, useState } from 'react';
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
}

/**
 * Universal Modal Portal component that renders modals at the top of the DOM
 * to avoid z-index and stacking context issues in complex UIs (especially Telegram WebView).
 * 
 * Features:
 * - Renders via React Portal to document.body
 * - High z-index (300+ by default) to stay above all game layers
 * - Uses onPointerDown for reliable touch/click handling
 * - Proper accessibility attributes (role, aria-modal)
 * - AnimatePresence for smooth enter/exit animations
 */
export function ModalPortal({
  isOpen,
  onClose,
  children,
  zIndex = 300,
  testId,
  backdropClassName = 'bg-black/70 backdrop-blur-sm',
  closeOnBackdropClick = true,
}: ModalPortalProps) {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

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

  if (!portalTarget) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center p-4 pointer-events-auto"
          style={{ zIndex }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-testid={testId}
          role="dialog"
          aria-modal="true"
        >
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
      )}
    </AnimatePresence>,
    portalTarget
  );
}

export default ModalPortal;
