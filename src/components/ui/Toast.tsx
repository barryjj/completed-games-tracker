import React from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "warning";
}

export default function Toast({ message, type = "success" }: ToastProps) {
  const base =
    "fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-sm font-semibold";

  const typeClass =
    type === "error"
      ? "toast-error"
      : type === "warning"
      ? "toast-warning"
      : "toast-success";

  return <div className={`${base} ${typeClass}`}>{message}</div>;
}
