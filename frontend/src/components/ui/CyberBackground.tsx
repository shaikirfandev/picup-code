'use client';

export default function CyberBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Cyber grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,240,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.04) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Ambient glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-cyber-glow/[0.03] blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-cyber-purple/[0.04] blur-[100px]" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] rounded-full bg-cyber-neon/[0.02] blur-[80px]" />

      {/* Scan line */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute left-0 right-0 h-[2px] animate-scan-line"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.15), transparent)',
          }}
        />
      </div>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-32 h-32">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-cyber-glow/30 to-transparent" />
        <div className="absolute top-0 left-0 h-full w-[1px] bg-gradient-to-b from-cyber-glow/30 to-transparent" />
      </div>
      <div className="absolute top-0 right-0 w-32 h-32">
        <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-l from-cyber-glow/30 to-transparent" />
        <div className="absolute top-0 right-0 h-full w-[1px] bg-gradient-to-b from-cyber-glow/30 to-transparent" />
      </div>
    </div>
  );
}
