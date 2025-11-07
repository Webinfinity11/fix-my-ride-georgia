import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Crown, Zap, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useServiceVIPRequest, useCreateVIPRequest, VIPPlanType } from '@/hooks/useVIPRequests';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface VIPRequestCardProps {
  serviceId: number;
  serviceName: string;
}

export function VIPRequestCard({ serviceId, serviceName }: VIPRequestCardProps) {
  const { data: existingRequest, isLoading } = useServiceVIPRequest(serviceId);
  const createRequest = useCreateVIPRequest();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<VIPPlanType>('vip');
  const [message, setMessage] = useState('');
  
  const handleRequestVIP = (plan: VIPPlanType) => {
    setSelectedPlan(plan);
    setDialogOpen(true);
  };
  
  const handleSubmit = async () => {
    await createRequest.mutateAsync({
      serviceId,
      plan: selectedPlan,
      message,
    });
    setDialogOpen(false);
    setMessage('');
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }
  
  // Show pending/need_info status
  if (existingRequest) {
    return (
      <Card className="border-primary/40 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            VIP მოთხოვნა
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            გაზარდე სერვისის ხილვადობა
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            მოითხოვე VIP სტატუსი სერვისისთვის და გაზარდე მისი ხილვადობა პლატფორმაზე.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={() => handleRequestVIP('vip')}
              variant="outline"
              className="h-auto p-4 flex-col items-start gap-2 hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950"
            >
              <div className="flex items-center gap-2 font-semibold">
                <Crown className="h-4 w-4 text-yellow-500" />
                VIP
              </div>
              <ul className="text-xs text-left space-y-1 text-muted-foreground">
                <li>• პრიორიტეტული ჩვენება</li>
                <li>• VIP Badge</li>
                <li>• გაზრდილი ხილვადობა</li>
              </ul>
            </Button>
            
            <Button
              onClick={() => handleRequestVIP('super_vip')}
              variant="outline"
              className="h-auto p-4 flex-col items-start gap-2 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950"
            >
              <div className="flex items-center gap-2 font-semibold">
                <Zap className="h-4 w-4 text-purple-500" />
                Super VIP
              </div>
              <ul className="text-xs text-left space-y-1 text-muted-foreground">
                <li>• ყველაფერი VIP-დან</li>
                <li>• Top პოზიცია</li>
                <li>• Super VIP Badge</li>
                <li>• მაქსიმალური ხილვადობა</li>
              </ul>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Request Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPlan === 'super_vip' ? (
                <>
                  <Zap className="h-5 w-5 text-purple-500" />
                  Super VIP მოთხოვნა
                </>
              ) : (
                <>
                  <Crown className="h-5 w-5 text-yellow-500" />
                  VIP მოთხოვნა
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              სერვისი: <strong>{serviceName}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                დამატებითი ინფორმაცია (არასავალდებულო)
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="მიუთითეთ რატომ გსურთ VIP სტატუსი ამ სერვისისთვის..."
                rows={4}
              />
            </div>
            
            <p className="text-xs text-muted-foreground">
              თქვენი მოთხოვნა გაიგზავნება ადმინისტრაციაში განსახილველად. 
              ჩვენ დაგიკავშირდებით დამატებითი დეტალებისთვის.
            </p>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1"
              >
                გაუქმება
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createRequest.isPending}
                className="flex-1"
              >
                {createRequest.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    იგზავნება...
                  </>
                ) : (
                  'გაგზავნა'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
