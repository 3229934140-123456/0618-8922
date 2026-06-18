import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Camera, Menu, X } from 'lucide-react';

const navLinks = [
  { path: '/', label: '首页' },
  { path: '/services', label: '服务' },
  { path: '/booking', label: '预约' },
  { path: '/my-bookings', label: '我的预约' },
  { path: '/admin', label: '管理' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-charcoal/95 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Camera className="w-6 h-6 text-gold" />
          <span className="font-display text-xl text-ivory tracking-wider group-hover:text-gold transition-colors">
            光影工作室
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-body tracking-wide transition-colors ${
                location.pathname === link.path
                  ? 'text-gold'
                  : 'text-ivory/70 hover:text-gold'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <button
          className="md:hidden text-ivory"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-charcoal border-t border-gold/20">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setOpen(false)}
              className={`block px-6 py-3 text-sm font-body transition-colors ${
                location.pathname === link.path
                  ? 'text-gold bg-charcoal-light'
                  : 'text-ivory/70 hover:text-gold hover:bg-charcoal/80'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
