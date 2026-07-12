import React from 'react';

/* ─────────────────────────────────────────────
   MicrOps Design Primitives
   Enforces 8pt grid, type scale, brand colors.
   ───────────────────────────────────────────── */

// ── Card ──────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'accent';
  padding?: 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
}) => {
  const base = 'rounded-xl border transition-colors';
  const variants = {
    default: 'bg-surface border-border-subtle',
    elevated: 'bg-surface-elevated border-border-subtle',
    accent: 'bg-surface border-gold/30',
  };
  const paddings = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div className={`${base} ${variants[variant]} ${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
};


// ── SectionHeader ─────────────────────────────
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  action,
  size = 'md',
}) => {
  const sizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h3 className={`font-headline-md ${sizes[size]} text-ivory font-semibold tracking-tight`}>
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-text-secondary mt-0.5 font-mono">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};


// ── StatCard ──────────────────────────────────
interface StatCardProps {
  label: string;
  value: string;
  status?: 'healthy' | 'warning' | 'critical' | 'neutral';
  statusText?: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  status = 'neutral',
  statusText,
  icon,
  footer,
}) => {
  const statusColors = {
    healthy: 'text-success',
    warning: 'text-warning',
    critical: 'text-error',
    neutral: 'text-text-secondary',
  };

  return (
    <Card className="flex flex-col justify-between min-h-[200px]">
      <div className="flex items-center justify-between">
        {icon && <span className="text-text-muted">{icon}</span>}
        {statusText && (
          <span className={`font-mono text-xs font-medium ${statusColors[status]}`}>
            {statusText}
          </span>
        )}
      </div>

      <div className="my-4">
        <div className="text-4xl font-semibold font-headline-md tracking-tight text-ivory">
          {value}
        </div>
        <div className="font-mono text-[11px] uppercase tracking-wider text-text-muted mt-1.5">
          {label}
        </div>
      </div>

      {footer && (
        <div className="pt-3 border-t border-border-subtle">{footer}</div>
      )}
    </Card>
  );
};


// ── StatusBadge ───────────────────────────────
interface StatusBadgeProps {
  status: 'deploying' | 'success' | 'failed' | 'pending' | 'testing' | 'building';
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'sm',
}) => {
  const configs = {
    deploying: { bg: 'bg-gold/10 border-gold', text: 'text-gold', dot: 'bg-gold animate-pulse' },
    success: { bg: 'bg-success/10 border-success/50', text: 'text-success', dot: 'bg-success' },
    failed: { bg: 'bg-error/10 border-error/50', text: 'text-error', dot: 'bg-error' },
    pending: { bg: 'bg-surface-elevated border-border-subtle', text: 'text-text-muted', dot: 'bg-text-muted' },
    testing: { bg: 'bg-info/10 border-info/50', text: 'text-info', dot: 'bg-info' },
    building: { bg: 'bg-gold/10 border-gold/50', text: 'text-gold', dot: 'bg-gold animate-pulse' },
  };

  const defaultLabels = {
    deploying: 'Deploying',
    success: 'Healthy',
    failed: 'Failed',
    pending: 'Pending',
    testing: 'Testing',
    building: 'Building',
  };

  const c = configs[status];
  const displayLabel = label || defaultLabels[status];
  const sizeClasses = size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 ${sizeClasses} rounded border font-mono font-bold uppercase tracking-wider ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      <span>{displayLabel}</span>
    </span>
  );
};


// ── FormField ─────────────────────────────────
interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  hint?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ label, children, hint }) => {
  return (
    <div>
      <label className="block text-text-secondary mb-1.5 uppercase tracking-wider text-[11px] font-mono">
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-[11px] text-text-muted mt-1 font-mono">{hint}</p>
      )}
    </div>
  );
};


// ── Input ─────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = ({ className = '', ...props }) => {
  return (
    <input
      className={`w-full bg-obsidian border border-border-subtle rounded-lg px-3 py-2.5 text-ivory text-sm font-mono focus:border-gold focus:outline-none transition-colors ${className}`}
      {...props}
    />
  );
};


// ── Select ────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ className = '', children, ...props }) => {
  return (
    <select
      className={`w-full bg-obsidian border border-border-subtle rounded-lg px-3 py-2.5 text-ivory text-sm font-mono focus:border-gold focus:outline-none transition-colors ${className}`}
      {...props}
    >
      {children}
    </select>
  );
};


// ── EmptyState ────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {icon && <div className="text-text-muted mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-ivory mb-2">{title}</h3>
      <p className="text-sm text-text-secondary max-w-md mb-6">{description}</p>
      {action}
    </div>
  );
};


// ── Toast ─────────────────────────────────────
interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onDismiss }) => {
  const colors = {
    success: 'border-success/50 text-success',
    error: 'border-error/50 text-error',
    info: 'border-gold/50 text-gold',
  };

  React.useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`fixed bottom-6 right-6 z-[100] bg-surface border ${colors[type]} rounded-lg px-5 py-3 font-mono text-sm shadow-2xl animate-fadeIn flex items-center gap-3`}>
      <span>{message}</span>
      <button onClick={onDismiss} className="text-text-muted hover:text-ivory text-lg leading-none">&times;</button>
    </div>
  );
};

// ── ConfirmModal ──────────────────────────────
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'primary';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-obsidian/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-surface-elevated border border-border-subtle rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleIn">
        <div className="p-6">
          <h3 className="text-xl font-bold text-ivory mb-2">{title}</h3>
          <p className="text-text-secondary text-sm leading-relaxed">{message}</p>
        </div>
        <div className="px-6 py-4 bg-surface-tertiary/30 border-t border-border-subtle flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-ivory hover:bg-surface-tertiary transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              variant === 'danger'
                ? 'bg-error/10 text-error hover:bg-error hover:text-ivory border border-error/30 hover:border-error'
                : 'bg-gold/10 text-gold hover:bg-gold hover:text-obsidian border border-gold/30 hover:border-gold'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
