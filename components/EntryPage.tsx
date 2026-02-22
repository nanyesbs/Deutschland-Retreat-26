import React, { useState } from 'react';

interface EntryPageProps {
    onAccessGranted: () => void;
}

const EntryPage: React.FC<EntryPageProps> = ({ onAccessGranted }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'esbsdeutschlandretreat26') {
            setError(false);
            onAccessGranted();
        } else {
            setError(true);
            setTimeout(() => setError(false), 500); // Reset error state for animation
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-surface)] flex flex-col justify-center items-center px-6 transition-colors duration-500 relative overflow-hidden">

            {/* Background Cinematic Glow Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand-heaven-gold/5 blur-[120px] rounded-full point-events-none" />

            <div className="z-10 w-full max-w-md mx-auto flex flex-col items-center">

                {/* Minimalist Logo / Typography */}
                <div className="mb-16 text-center">
                    <h1 className="text-sm md:text-base font-avenir-bold uppercase tracking-[0.4em] text-white/90 mb-2">
                        Europe Shall Be Saved
                    </h1>
                    <p className="text-[10px] md:text-xs font-avenir-medium uppercase tracking-[0.2em] text-brand-heaven-gold">
                        Reaching Germany Retreat
                    </p>
                </div>

                {/* Password Form */}
                <form onSubmit={handleSubmit} className="w-full relative group">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="ACCESS CODE"
                        className={`w-full bg-transparent border-b ${error ? 'border-red-500 text-red-400' : 'border-white/10 text-white focus:border-brand-heaven-gold'} py-4 text-center text-sm tracking-[0.5em] font-avenir-medium outline-none transition-all placeholder:text-white/20 uppercase ${error ? 'animate-shake' : ''}`}
                        autoFocus
                    />

                    {/* Subtle Submit Indicator that appears on typing */}
                    <button
                        type="submit"
                        className={`absolute right-0 top-1/2 -translate-y-1/2 p-2 text-[10px] font-avenir-bold text-brand-heaven-gold tracking-widest uppercase transition-opacity duration-300 ${password.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    >
                        Enter
                    </button>
                </form>

                {/* Error Message */}
                <div className="h-6 mt-4">
                    <span className={`text-[10px] uppercase font-avenir-medium tracking-widest text-red-500 transition-opacity duration-300 ${error ? 'opacity-100' : 'opacity-0'}`}>
                        Invalid Access Code
                    </span>
                </div>

            </div>
        </div>
    );
};

export default EntryPage;
