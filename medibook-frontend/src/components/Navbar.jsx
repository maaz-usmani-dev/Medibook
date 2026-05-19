import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { List, X } from '@phosphor-icons/react';
// import Logo from './Logo';

const links = [
  { to: '/', label: 'Home' },
  { to: '/doctors', label: 'Find Doctors' },
  // { to: '/about', label: 'About' },
  // { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => setMobileOpen(false), [location]);

  const isActive = (to) => location.pathname === to;

  return (
    <header className={`sticky top-0 z-50 bg-white/95 backdrop-blur-[12px] border-b border-border transition-shadow duration-300 ${scrolled ? 'shadow-sm' : ''}`}>
      <div className="max-w-[1240px] mx-auto px-10 h-[72px] flex items-center justify-between">
        {/* <Link to="/"><Logo /></Link> */}

        <nav className="hidden md:flex items-center gap-9">
          {links.map(l => (
            <Link key={l.to} to={l.to}
              className={`text-[14px] font-medium transition-colors duration-200 pb-1 relative ${
                isActive(l.to) ? 'text-blue' : 'text-slate hover:text-blue'
              }`}>
              {l.label}
              {isActive(l.to) && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="btn-ghost">Login</Link>
          <Link to="/signup" className="btn-primary">Sign Up Free</Link>
        </div>

        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={22} weight="bold" className="text-slate" /> : <List size={22} weight="bold" className="text-slate" />}
        </button>
      </div>

      <div className={`md:hidden border-t border-border bg-white overflow-hidden transition-all duration-300 ${mobileOpen ? 'max-h-80' : 'max-h-0'}`}>
        <div className="px-6 py-4 space-y-1">
          {links.map(l => (
            <Link key={l.to} to={l.to}
              className={`block px-4 py-2.5 rounded-sm text-[14px] font-medium transition-colors ${
                isActive(l.to) ? 'bg-blue-light text-blue' : 'text-slate hover:text-dark'
              }`}>
              {l.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-border flex gap-2">
            <Link to="/login" className="flex-1 btn-ghost justify-center">Login</Link>
            <Link to="/signup" className="flex-1 btn-primary justify-center">Sign Up</Link>
          </div>
        </div>
      </div>
    </header>
  );
}
