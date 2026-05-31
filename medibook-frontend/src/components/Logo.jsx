import { Link } from 'react-router-dom';

export default function Logo({ dark = false, className = '' }) {
  const textColor = dark ? 'text-white' : 'text-dark';
  const subColor = dark ? 'text-white/55' : 'text-muted';

  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 ${className}`} aria-label="MediBook home">
      <svg width="38" height="38" viewBox="0 0 38 38" role="img" aria-hidden="true" className="flex-shrink-0">
        <rect width="38" height="38" rx="10" fill="#1A6EBF" />
        <path d="M10 13.2C10 11.43 11.43 10 13.2 10h11.6C26.57 10 28 11.43 28 13.2v11.6c0 1.77-1.43 3.2-3.2 3.2H13.2A3.2 3.2 0 0 1 10 24.8V13.2Z" fill="white" opacity=".96" />
        <path d="M14 14.5h3.2l2.05 4.05 2.05-4.05H24v9h-2.6v-4.55l-1.4 2.75h-1.6L17 18.95v4.55h-3v-9Z" fill="#1A6EBF" />
        <path d="M18.1 12.6h1.8v3.1h3.1v1.8h-3.1v3.1h-1.8v-3.1H15v-1.8h3.1v-3.1Z" fill="#11B080" />
      </svg>
      <span className="leading-none">
        <span className={`block font-fraunces text-[22px] font-semibold tracking-normal ${textColor}`}>MediBook</span>
        <span className={`block text-[10px] font-bold uppercase tracking-[1.2px] mt-1 ${subColor}`}>Care on time</span>
      </span>
    </Link>
  );
}
