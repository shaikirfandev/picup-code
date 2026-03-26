export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[10px] font-mono tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
          LOADING COMMAND CENTER...
        </p>
      </div>
    </div>
  );
}
