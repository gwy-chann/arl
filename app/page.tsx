export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-bg-base font-sans p-6">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center gap-8 py-16 px-8 bg-bg-surface border border-border rounded-xl shadow-xs text-center sm:text-left sm:items-start">
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 self-start rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
            <span>●</span> Design System Initialized
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            ARLQ Inventory & Sales System
          </h1>
          <p className="text-base text-text-secondary">
            Enterprise design tokens and color architecture established from the mockup specifications.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
          <div className="p-4 rounded-lg bg-bg-muted border border-border flex flex-col gap-1">
            <span className="text-xs font-medium text-text-muted">Primary Brand</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-5 h-5 rounded-full bg-primary border border-primary-border" />
              <span className="text-sm font-semibold text-text-primary">Forest Green</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-bg-muted border border-border flex flex-col gap-1">
            <span className="text-xs font-medium text-text-muted">Success Status</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-5 h-5 rounded-full bg-success border border-success-border" />
              <span className="text-sm font-semibold text-text-primary">Positive</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-bg-muted border border-border flex flex-col gap-1">
            <span className="text-xs font-medium text-text-muted">Accent / Warning</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-5 h-5 rounded-full bg-accent border border-accent-border" />
              <span className="text-sm font-semibold text-text-primary">Pending</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-bg-muted border border-border flex flex-col gap-1">
            <span className="text-xs font-medium text-text-muted">Danger / Alert</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-5 h-5 rounded-full bg-danger border border-danger-border" />
              <span className="text-sm font-semibold text-text-primary">Low Stock</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-text-light transition-colors hover:bg-primary-hover active:bg-primary-border shadow-xs cursor-pointer"
          >
            Primary Action
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-secondary px-5 py-2.5 text-sm font-semibold text-text-primary border border-border-subtle transition-colors hover:bg-secondary-hover shadow-xs cursor-pointer"
          >
            Secondary Action
          </button>
        </div>
      </main>
    </div>
  );
}
