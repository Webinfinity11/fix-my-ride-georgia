
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const ServiceCardSkeleton = () => {
  return (
    <Card className="h-full animate-pulse">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-5 w-20" />
      </CardHeader>
      <CardContent className="flex-grow pb-3">
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-12" />
          </div>
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardContent>
      <div className="p-6 pt-3">
        <Skeleton className="h-10 w-full" />
      </div>
    </Card>
  );
};

export default ServiceCardSkeleton;
