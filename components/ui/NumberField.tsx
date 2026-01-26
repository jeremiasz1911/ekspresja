"use client";

import { FieldError } from "./FieldError";

type Props = {
  value: number | "";
  placeholder?: string;
  min?: number;
  error?: string;
  touched?: boolean;
  onChange(value: number | ""): void;
  onBlur(): void;
};

export function NumberField({
  value,
  placeholder,
  min,
  error,
  touched,
  onChange,
  onBlur,
}: Props) {
  return (
    <div>
      <input
        type="number"
        min={min}
        value={value}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(e.target.value === "" ? "" : Number(e.target.value))
        }
        onBlur={onBlur}
        className={`input ${
          error && touched ? "border-red-500" : ""
        }`}
      />

      <FieldError message={touched ? error : undefined} />
    </div>
  );
}
