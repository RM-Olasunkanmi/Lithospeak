import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronDownIcon, InfoIcon } from "./icons";

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="tooltip-anchor" data-tooltip={label}>
      {children}
    </span>
  );
}

export function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <span className="field-label">
      {children}
      {hint && (
        <Tooltip label={hint}>
          <InfoIcon size={13} className="hint-icon" />
        </Tooltip>
      )}
    </span>
  );
}

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  precision = 0,
  hint,
  onChange,
  onSettle,
  disabled
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  precision?: number;
  hint?: string;
  onChange: (value: number) => void;
  onSettle?: () => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className={`field-slider${disabled ? " is-disabled" : ""}`}>
      <div className="field-slider-row">
        <label htmlFor={id}>
          <FieldLabel hint={hint}>{label}</FieldLabel>
        </label>
        <input
          className="field-number"
          type="number"
          value={Number(value.toFixed(precision))}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (!Number.isNaN(next)) onChange(Math.min(max, Math.max(min, next)));
          }}
          onBlur={onSettle}
          aria-label={`${label} value`}
        />
        {unit && <span className="field-unit">{unit}</span>}
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        onPointerUp={onSettle}
        onKeyUp={onSettle}
      />
    </div>
  );
}

export function ToggleField({
  label,
  checked,
  onChange,
  hint
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="field-toggle">
      <span className="switch">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span className="switch-track" aria-hidden="true">
          <span className="switch-thumb" />
        </span>
      </span>
      <FieldLabel hint={hint}>{label}</FieldLabel>
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  hint
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="field-select">
      <label htmlFor={id}>
        <FieldLabel hint={hint}>{label}</FieldLabel>
      </label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; icon?: ReactNode }>;
  ariaLabel: string;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          className={value === option.value ? "segmented-item is-active" : "segmented-item"}
          onClick={() => onChange(option.value)}
        >
          {option.icon}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

export function IconButton({
  label,
  icon,
  onClick,
  active,
  disabled
}: {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        className={active ? "icon-button is-active" : "icon-button"}
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        aria-pressed={active}
      >
        {icon}
      </button>
    </Tooltip>
  );
}

export function Section({
  title,
  children,
  defaultOpen = false,
  badge,
  actions
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: ReactNode;
  actions?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details className="section" open={open} onToggle={(event) => setOpen((event.target as HTMLDetailsElement).open)}>
      <summary className="section-header">
        <span className="section-header-title">
          <ChevronDownIcon size={14} className="section-chevron" />
          {title}
          {badge}
        </span>
        {actions && (
          <span className="section-actions" onClick={(event) => event.stopPropagation()}>
            {actions}
          </span>
        )}
      </summary>
      <div className="section-body">{children}</div>
    </details>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <p className="empty-state-title">{title}</p>
      {description && <p className="empty-state-description">{description}</p>}
      {action}
    </div>
  );
}

export interface ToastMessage {
  id: string;
  tone: "success" | "error" | "info";
  text: string;
}

export function ToastStack({ toasts, onDismiss }: { toasts: ToastMessage[]; onDismiss: (id: string) => void }) {
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  const timer = useRef<number>();
  useEffect(() => {
    timer.current = window.setTimeout(() => onDismiss(toast.id), 4200);
    return () => window.clearTimeout(timer.current);
  }, [toast.id, onDismiss]);
  return (
    <div className={`toast toast-${toast.tone}`}>
      <span>{toast.text}</span>
      <button type="button" aria-label="Dismiss notification" onClick={() => onDismiss(toast.id)}>
        &times;
      </button>
    </div>
  );
}
