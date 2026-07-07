import Card from "./Card";
import SkeletonLoader from "./SkeletonLoader";

export default function LoadingSkeleton({ lines = 3, className = "" }) {
  return (
    <Card className={className}>
      <SkeletonLoader lines={lines} />
    </Card>
  );
}
