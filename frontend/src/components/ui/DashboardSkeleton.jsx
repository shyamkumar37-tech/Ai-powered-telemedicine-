export default function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton">
      <div className="dashboard-skeleton__header" />
      <div className="dashboard-skeleton__grid">
        <div className="dashboard-skeleton__stat" />
        <div className="dashboard-skeleton__stat" />
        <div className="dashboard-skeleton__stat" />
        <div className="dashboard-skeleton__stat" />
      </div>
      <div className="dashboard-skeleton__panel" />
      <div className="dashboard-skeleton__panel" />
    </div>
  );
}
