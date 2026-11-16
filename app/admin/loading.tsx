export default function AdminLoading() {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-3 py-24 text-muted-foreground text-sm"
    >
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
      Cargando panel…
    </div>
  );
}
