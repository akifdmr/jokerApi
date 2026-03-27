import React from "react";

function BaseIcon({ children }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export function EscIcon() {
  return (
    <BaseIcon>
      <path
        fill="currentColor"
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v13A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5v-13ZM6.5 5a.5.5 0 0 0-.5.5V7h12V5.5a.5.5 0 0 0-.5-.5h-11ZM6 9v9.5c0 .276.224.5.5.5h11a.5.5 0 0 0 .5-.5V9H6Z"
      />
      <path fill="currentColor" d="M8 12h8v2H8v-2Zm0 4h5v2H8v-2Z" opacity="0.85" />
    </BaseIcon>
  );
}

export function CardIcon() {
  return (
    <BaseIcon>
      <path
        fill="currentColor"
        d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9ZM5.5 7a.5.5 0 0 0-.5.5V9h16V7.5a.5.5 0 0 0-.5-.5h-13ZM5 11v5.5c0 .276.224.5.5.5h13a.5.5 0 0 0 .5-.5V11H5Z"
      />
      <path fill="currentColor" d="M7 14h6v2H7v-2Z" opacity="0.85" />
    </BaseIcon>
  );
}

export function PosIcon() {
  return (
    <BaseIcon>
      <path
        fill="currentColor"
        d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm0 2v16h10V4H7Z"
      />
      <path fill="currentColor" d="M8.5 7h7v2h-7V7Zm0 4h7v2h-7v-2Zm0 4H12v2H8.5v-2Z" opacity="0.85" />
    </BaseIcon>
  );
}

export function UsBankIcon() {
  return (
    <BaseIcon>
      <path
        fill="currentColor"
        d="M12 2 3 6.5V10h18V6.5L12 2Zm7 6H5V7.7L12 4.4l7 3.3V8Z"
      />
      <path
        fill="currentColor"
        d="M4 11h16v2H4v-2Zm2 3h2v6H6v-6Zm5 0h2v6h-2v-6Zm5 0h2v6h-2v-6ZM4 20h16v2H4v-2Z"
        opacity="0.9"
      />
    </BaseIcon>
  );
}

export function HistoryIcon() {
  return (
    <BaseIcon>
      <path
        fill="currentColor"
        d="M12 4a8 8 0 1 1-7.2 4.5H2V6h6v6H5.6A6 6 0 1 0 12 6c-.98 0-1.9.24-2.7.66L8.2 5.2A7.95 7.95 0 0 1 12 4Z"
      />
      <path fill="currentColor" d="M11 8h2v5l4 2-1 1.7-5-2.6V8Z" opacity="0.85" />
    </BaseIcon>
  );
}

export function FinanceIcon() {
  return (
    <BaseIcon>
      <path
        fill="currentColor"
        d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 2v12h14V6H5Z"
      />
      <path
        fill="currentColor"
        d="M7 15h2v2H7v-2Zm4-4h2v6h-2v-6Zm4-2h2v8h-2V9Z"
        opacity="0.9"
      />
    </BaseIcon>
  );
}

