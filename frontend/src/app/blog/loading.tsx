export default function BlogLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--foreground)' }} />
        <p className="text-[14px]" style={{ color: 'var(--text-tertiary)' }}>
          Loading...
        </p>
      </div>
    </div>
  );
}
