
import React from 'react';

interface HeaderProps {
  darkMode?: boolean;
}

const Header: React.FC<HeaderProps> = ({ darkMode }) => {
  return (
    <header className="relative w-full h-[55vh] flex flex-col items-center justify-center overflow-hidden bg-[var(--bg-surface)] transition-colors duration-500">
      {/* Background Image — full bleed, balanced scale for the flag */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url("/bg-flag.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* Layer 1 — deep dark base for readability */}
      <div className="absolute inset-0 z-10 bg-black/55" />
      {/* Layer 2 — gold-tinted cinematic vignette: bottom fade into page */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(187,148,70,0.08) 50%, var(--bg-surface) 100%)',
        }}
      />
      {/* Layer 3 — top edge darkness for nav contrast */}
      <div className="absolute top-0 left-0 right-0 h-24 z-10 bg-gradient-to-b from-black/40 to-transparent" />

      {/* SVG Logo (Top Right) */}
      <div className="absolute top-8 right-8 z-20 hidden md:block">
        <img
          src={darkMode ? "/logo-dark.png" : "/logo-light.png"}
          alt="Leaders' Summit Logo"
          className="h-16 w-auto object-contain"
        />
      </div>

      {/* Hero Content */}
      <div className="relative z-20 text-center px-4 max-w-4xl flex flex-col items-center">
        <span className="text-[10px] md:text-xs tracking-[0.5em] font-light text-white/80 dark:text-white/80 uppercase mb-4 animate-fade-in">
          EUROPE SHALL BE SAVED
        </span>

        <h1 className="text-4xl md:text-7xl font-extrabold text-white dark:text-white uppercase leading-tight mb-6">
          Reaching Germany <br />
          <span className="tracking-tighter">Retreat</span>
        </h1>

        <div className="w-24 h-[2px] bg-[#BB9446] mb-3" />

        <p className="text-sm md:text-lg font-normal text-white/90 dark:text-white/90 tracking-widest uppercase">
          24.02.26 – 26.02.26
        </p>
      </div>
    </header>
  );
};

export default Header;
