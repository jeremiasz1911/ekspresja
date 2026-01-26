"use client";

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
      ⚠️ {message}
    </p>
  );
}
