import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Loader2 } from 'lucide-react';
import { useServiceVIPRequest, useCreateVIPRequest, VIPPlanType } from '@/hooks/useVIPRequests';

interface VIPRequestCardProps {
  serviceId: number;
  serviceName: string;
}

export function VIPRequestCard({ serviceId }: VIPRequestCardProps) {
  const { data: existingRequest, isLoading } = useServiceVIPRequest(serviceId);
  const createRequest = useCreateVIPRequest();

  const handleRequestVIP = async (plan: VIPPlanType) => {
    try {
      await createRequest.mutateAsync({
        serviceId,
        plan,
        message: '',
      });
    } catch {
      // The mutation displays the error toast.
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center p-4 sm:p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }
  
  // Show pending/need_info status
  if (existingRequest) {
    return (
      <Card className="border-primary/40 bg-primary/5">
        <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Crown className="h-5 w-5 text-yellow-500" />
            VIP მოთხოვნა
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">სტატუსი:</span>
            <Badge variant={existingRequest.status === 'pending' ? 'secondary' : 'default'}>
              {existingRequest.status === 'pending' ? 'მოლოდინში' : 'საჭიროა ინფო'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">გეგმა:</span>
            <Badge variant="outline" className="flex items-center gap-1">
              {existingRequest.requested_plan === 'super_vip' ? (
                <>
                  <Zap className="h-3 w-3" />
                  Super VIP
                </>
              ) : (
                <>
                  <Crown className="h-3 w-3" />
                  VIP
                </>
              )}
            </Badge>
          </div>
          
          {existingRequest.admin_message && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs font-medium mb-1">ადმინისგან:</p>
              <p className="text-sm">{existingRequest.admin_message}</p>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground">
            თქვენი მოთხოვნა განხილვის პროცესშია. ჩვენ დაგიკავშირდებით დამატებითი დეტალებისთვის.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Show VIP request options
  return (
    <>
      <Card className="border-yellow-500/40">
        <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-3">
          <CardTitle className="flex items-start gap-2 text-base leading-snug sm:items-center sm:text-lg">
            <Crown className="h-5 w-5 text-yellow-500" />
            გაზარდე სერვისის ხილვადობა
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              type="button"
              onClick={() => handleRequestVIP('vip')}
              disabled={createRequest.isPending}
              variant="outline"
              className="h-12 w-full justify-start whitespace-normal px-4 text-left hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950"
            >
              <div className="flex items-center gap-2 font-semibold">
                {createRequest.isPending && createRequest.variables?.plan === 'vip' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Crown className="h-4 w-4 text-yellow-500" />
                )}
                VIP
              </div>
            </Button>
            
            <Button
              type="button"
              onClick={() => handleRequestVIP('super_vip')}
              disabled={createRequest.isPending}
              variant="outline"
              className="h-12 w-full justify-start whitespace-normal px-4 text-left hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950"
            >
              <div className="flex items-center gap-2 font-semibold">
                {createRequest.isPending && createRequest.variables?.plan === 'super_vip' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 text-purple-500" />
                )}
                Super VIP
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
