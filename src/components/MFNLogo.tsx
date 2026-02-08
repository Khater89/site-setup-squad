interface MFNLogoProps {
  size?: number;
  className?: string;
}

const MFNLogo = ({ size = 40, className = "" }: MFNLogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="MFN Logo"
  >
    <defs>
      <linearGradient id="mfn-bg" x1="0" y1="0" x2="48" y2="48">
        <stop offset="0%" stopColor="hsl(26, 100%, 55%)" />
        <stop offset="100%" stopColor="hsl(18, 100%, 48%)" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="12" fill="url(#mfn-bg)" />
    <text
      x="24"
      y="30.5"
      textAnchor="middle"
      fill="white"
      fontFamily="Inter, Arial, sans-serif"
      fontWeight="900"
      fontSize="15.5"
      letterSpacing="1"
    >
      MFN
    </text>
  </svg>
);

export default MFNLogo;
