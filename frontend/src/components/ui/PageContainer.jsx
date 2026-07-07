export default function PageContainer({ className = "", children }) {
  return (
    <div className={`mx-auto w-full max-w-7xl ${className}`.trim()}>
      {children}
    </div>
  );
}
