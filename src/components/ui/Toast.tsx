import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning';
  duration?: number; // in ms
  width?: string; // Tailwind width class, e.g., "w-full", "w-80"
}

export default function Toast({
  message,
  type = 'success',
  duration = 2000,
  width = 'w-80',
}: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true); // trigger slide-down
    const timeout = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timeout);
  }, [duration]);

  const base =
    `toast-box fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-sm font-semibold transition-all duration-300 ease-out ` +
    `${width} transform`;

  const typeClass =
    type === 'error' ? 'toast-error' : type === 'warning' ? 'toast-warning' : 'toast-success';

  return (
    <div
      className={`${base} ${typeClass} ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-6 opacity-0'
      }`}
    >
      {message}
    </div>
  );
}
