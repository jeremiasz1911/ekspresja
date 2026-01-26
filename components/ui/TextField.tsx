"use client";

import { FieldError } from "./FieldError";

type Props = {
  name: string;
  value: string | number;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  error?: string;
  touched?: boolean;
  onChange(value: string): void;
  onBlur(): void;
};

export function TextField({
  value,
  placeholder,
  type = "text",
  disabled,
  error,
  touched,
  onChange,
  onBlur,
}: Props) {
  return (
    <div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`input ${
          error && touched ? "border-red-500" : ""
        } ${disabled ? "opacity-70" : ""}`}
      />

      <FieldError message={touched ? error : undefined} />
    </div>
  );
}
