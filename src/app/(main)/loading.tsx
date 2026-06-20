export default function MainLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy aria-label="Loading page">
      <div className="h-9 w-56 bg-ink/10 rounded" />
      <div className="comic-card">
        <div className="comic-card-inner p-6 space-y-4">
          <div className="h-5 w-2/3 bg-ink/10 rounded" />
          <div className="h-4 w-full bg-ink/10 rounded" />
          <div className="h-4 w-5/6 bg-ink/10 rounded" />
          <div className="h-32 bg-ink/10 rounded" />
        </div>
      </div>
    </div>
  );
}
