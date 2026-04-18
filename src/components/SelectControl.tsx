import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  className?: string;
  ariaLabel?: string;
}

function SelectControl<T extends string>({
  value,
  onChange,
  options,
  className = '',
  ariaLabel,
}: SelectControlProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = options.find(o => o.value === value) ?? options[0];

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  return (
    <div ref={rootRef} className={`select-control ${open ? 'select-control--open' : ''} ${className}`.trim()}>
      <button
        type="button"
        className="select-control__btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen(o => !o)}
      >
        <span className="select-control__value">{current?.label}</span>
        <span className="select-control__chevron" aria-hidden>
          ▾
        </span>
      </button>
      {open && (
        <ul className="select-control__list" role="listbox">
          {options.map(opt => (
            <li key={opt.value} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={opt.value === value}
                className={`select-control__option ${opt.value === value ? 'is-active' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  close();
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SelectControl;
