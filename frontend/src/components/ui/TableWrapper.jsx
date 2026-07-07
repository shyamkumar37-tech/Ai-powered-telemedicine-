export default function TableWrapper({ children, className = "" }) {
  return (
    <div className={`glass-card overflow-hidden ${className}`.trim()}>
      <div className="overflow-x-auto">
        {children}
      </div>
    </div>
  );
}
