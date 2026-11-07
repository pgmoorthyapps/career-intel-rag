import * as React from "react"

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number
}

export function Logo({ size = 24, className, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Briefcase Base */}
      <path
        d="M6 10C6 8.89543 6.89543 8 8 8H24C25.1046 8 26 8.89543 26 10V24C26 25.1046 25.1046 26 24 26H8C6.89543 26 6 25.1046 6 24V10Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Briefcase Handle */}
      <path
        d="M12 8V6C12 4.89543 12.8954 4 14 4H18C19.1046 4 20 4.89543 20 6V8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* AI / Neural Network Nodes (Inside) */}
      <circle cx="16" cy="16" r="2" fill="currentColor" />
      <circle cx="10" cy="20" r="1.5" fill="currentColor" />
      <circle cx="22" cy="20" r="1.5" fill="currentColor" />
      <path d="M12 18L15 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 18L17 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 21H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
