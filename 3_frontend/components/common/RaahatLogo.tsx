export default function RaahatLogo({ size = 36, showText = true }: { size?: number; showText?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="18" cy="18" r="17" fill="#1a3a5c" />
        <path d="M18 8 L18 28" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M10 14 Q18 6 26 14" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <circle cx="18" cy="18" r="3" fill="white" />
        <path d="M12 22 Q18 30 24 22" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <circle cx="10" cy="14" r="1.5" fill="#5ba3d9"/>
        <circle cx="26" cy="14" r="1.5" fill="#5ba3d9"/>
        <circle cx="12" cy="22" r="1.5" fill="#5ba3d9"/>
        <circle cx="24" cy="22" r="1.5" fill="#5ba3d9"/>
      </svg>
      {showText && (
        <div>
          <div className="font-bold text-lg leading-none text-navy-900" style={{fontFamily: "Noto Sans, sans-serif", letterSpacing: "-0.02em"}}>RAAHAT</div>
          <div className="text-xs text-slate-500 leading-tight">Victim Support Platform</div>
        </div>
      )}
    </div>
  );
}
