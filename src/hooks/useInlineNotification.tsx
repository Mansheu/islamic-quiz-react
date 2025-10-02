import { useCallback, useMemo, useState } from 'react';
import InlineNotification from '../components/InlineNotification';

export type InlineType = 'success' | 'error';

export interface UseInlineNotificationOptions {
  autoClose?: boolean; // applies to success only (component enforces this)
  autoCloseDelay?: number;
  showIcon?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

interface InlineState {
  message: string;
  type: InlineType;
  visible: boolean;
}

export const useInlineNotification = (options: UseInlineNotificationOptions = {}) => {
  const {
    autoClose = true,
    autoCloseDelay = 3000,
    showIcon = true,
    showCloseButton = true,
    className = ''
  } = options;

  const [state, setState] = useState<InlineState | null>(null);

  const hide = useCallback(() => {
    setState(prev => (prev ? { ...prev, visible: false } : null));
  }, []);

  const show = useCallback((message: string, type: InlineType) => {
    setState({ message, type, visible: true });
    // Auto-close handling is implemented inside InlineNotification itself
  }, []);

  const showSuccess = useCallback((message: string) => show(message, 'success'), [show]);
  const showError = useCallback((message: string) => show(message, 'error'), [show]);

  const inlineNotification = useMemo(() => {
    if (!state) return null;
    return (
      <InlineNotification
        type={state.type}
        message={state.message}
        isVisible={state.visible}
        onDismiss={hide}
        autoClose={autoClose}
        autoCloseDelay={autoCloseDelay}
        showIcon={showIcon}
        showCloseButton={showCloseButton}
        className={className}
      />
    );
  }, [state, hide, autoClose, autoCloseDelay, showIcon, showCloseButton, className]);

  return {
    // state
    notification: state,
    // actions
    showInline: show,
    showSuccess,
    showError,
    hideInline: hide,
    // JSX to render wherever appropriate
    inlineNotification,
  } as const;
};

export default useInlineNotification;

