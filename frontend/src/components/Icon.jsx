import React from "react";

const paths = {
  arrow: (
    <>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="3" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  hidden: (
    <>
      <path d="m3 3 18 18M10 5.2a11 11 0 0 1 2-.2c6.4 0 10 7 10 7a17 17 0 0 1-3 3.8M6 6C3.4 8.3 2 12 2 12s3.6 7 10 7a11 11 0 0 0 5-1.2" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8" r="3" />
      <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0v5l2 3H4l2-3V9ZM10 21h4" />
    </>
  ),
  pin: (
    <>
      <path d="M19 10c0 6-7 11-7 11S5 16 5 10a7 7 0 0 1 14 0Z" />
      <circle cx="12" cy="10" r="2" />
    </>
  ),
  exit: (
    <>
      <path d="M10 4H5v16h5M10 12h11m-4-4 4 4-4 4" />
    </>
  ),
};

export default function Icon({ name, size = 20, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
