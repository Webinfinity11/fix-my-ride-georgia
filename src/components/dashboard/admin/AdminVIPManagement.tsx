import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  Crown, 
  Zap, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Loader2,
  Calendar,
  User,
  MapPin
} from 'lucide-react';
import {
  useAllVIPRequests,
  useApproveVIPRequest,
  useRejectVIPRequest,
  useRequestVIPInfo,
  VIPRequestStatus,
} from '@/hooks/useVIPRequests';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export function AdminVIPManagement() {
  const [selectedStatus, setSelectedStatus] = useState<VIPRequestStatus>('pending');
  const { data: requests, isLoading } = useAllVIPRequests(selectedStatus);
  
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: 'approve' | 'reject' | 'info' | null;
    requestId: string | null;
    serviceName: string | null;
  }>({ open: false, type: null, requestId: null, serviceName: null });
  
  const [durationDays, setDurationDays] = useState<string>('30');
  const [message, setMessage] = useState('');
  
  const approveRequest = useApproveVIPRequest();
  const rejectRequest = useRejectVIPRequest();
  const requestInfo = useRequestVIPInfo();
  
  const handleAction = (
    type: 'approve' | 'reject' | 'info',
    requestId: string,
    serviceName: string
  ) => {
    setActionDialog({
      open: true,
      type,
      requestId,
      serviceName,
    });
    setMessage('');
  };
  
  const handleSubmitAction = async () => {
    if (!actionDialog.requestId) return;
    
    try {
      if (actionDialog.type === 'approve') {
        await approveRequest.mutateAsync({
          requestId: actionDialog.requestId,
          durationDays: durationDays === 'permanent' ? null : parseInt(durationDays),
          message,
        });
      } else if (actionDialog.type === 'reject') {
        if (!message.trim()) {
          toast.error('გთხოვთ მიუთითოთ უარყოფის მიზეზი');
          return;
        }
        await rejectRequest.mutateAsync({
          requestId: actionDialog.requestId,
          reason: message,
        });
      } else if (actionDialog.type === 'info') {
        if (!message.trim()) {
          toast.error('გთხოვთ დაწეროთ შეტყობინება');
          return;
        }
        await requestInfo.mutateAsync({
          requestId: actionDialog.requestId,
          message,
        });
      }
      
      setActionDialog({ open: false, type: null, requestId: null, serviceName: null });
    } catch (error) {
      // Error handled by mutation
    }
  };
  
  const isPending = 
    approveRequest.isPending || 
    rejectRequest.isPending || 
    requestInfo.isPending;
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            VIP მოთხოვნების მართვა
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as VIPRequestStatus)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending">მოლოდინში</TabsTrigger>
              <TabsTrigger value="need_info">საჭიროა ინფო</TabsTrigger>
              <TabsTrigger value="approved">დამტკიცებული</TabsTrigger>
              <TabsTrigger value="rejected">უარყოფილი</TabsTrigger>
            </TabsList>
            
            <TabsContent value={selectedStatus} className="mt-6">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : !requests || requests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  მოთხოვნები ვერ მოიძებნა
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((request: any) => (
                    <Card key={request.id} className="border-primary/20">
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h4 className="font-semibold text-lg">
                                {request.mechanic_services?.name || 'N/A'}
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-3 w-3" />
                                {request.profiles?.first_name} {request.profiles?.last_name}
                              </div>
                              {request.mechanic_services?.city && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {request.mechanic_services.city}
                                  {request.mechanic_services.district && `, ${request.mechanic_services.district}`}
                                </div>
                              )}
                            </div>
                            <Badge 
                              className={
                                request.requested_plan === 'super_vip'
                                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                  : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                              }
                            >
                              {request.requested_plan === 'super_vip' ? (
                                <>
                                  <Zap className="h-3 w-3 mr-1" />
                                  Super VIP
                                </>
                              ) : (
                                <>
                                  <Crown className="h-3 w-3 mr-1" />
                                  VIP
                                </>
                              )}
                            </Badge>
                          </div>
                          
                          {/* Contact Info */}
                          <div className="flex items-center gap-4 text-sm flex-wrap">
                            {request.profiles?.email && (
                              <span className="text-muted-foreground">
                                📧 {request.profiles.email}
                              </span>
                            )}
                            {request.profiles?.phone && (
                              <span className="text-muted-foreground">
                                📞 {request.profiles.phone}
                              </span>
                            )}
                          </div>
                          
                          {/* Request Message */}
                          {request.message && (
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="text-sm font-medium mb-1">მოთხოვნის შეტყობინება:</p>
                              <p className="text-sm text-muted-foreground">{request.message}</p>
                            </div>
                          )}
                          
                          {/* Admin Message (if exists) */}
                          {request.admin_message && (
                            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                              <p className="text-sm font-medium mb-1">თქვენი შეტყობინება:</p>
                              <p className="text-sm">{request.admin_message}</p>
                            </div>
                          )}
                          
                          {/* Timestamps */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              მოთხოვნა: {new Date(request.requested_at).toLocaleDateString('ka-GE')}
                            </div>
                            {request.reviewed_at && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                განხილვა: {new Date(request.reviewed_at).toLocaleDateString('ka-GE')}
                              </div>
                            )}
                          </div>
                          
                          {/* Actions (only for pending/need_info) */}
                          {(request.status === 'pending' || request.status === 'need_info') && (
                            <div className="flex gap-2 pt-2 border-t flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction('approve', request.id, request.mechanic_services?.name || '')}
                                className="flex-1 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                დამტკიცება
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction('info', request.id, request.mechanic_services?.name || '')}
                                className="flex-1"
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                ინფოს მოთხოვნა
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction('reject', request.id, request.mechanic_services?.name || '')}
                                className="flex-1 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                უარყოფა
                              </Button>
                            </div>
                          )}
                          
                          {/* Approved Info */}
                          {request.status === 'approved' && (
                            <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                              <div className="flex items-center justify-between text-sm">
                                <span>ვადა:</span>
                                <span className="font-medium">
                                  {request.vip_ends_at 
                                    ? new Date(request.vip_ends_at).toLocaleDateString('ka-GE')
                                    : 'მუდმივი'}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {/* Rejected Info */}
                          {request.status === 'rejected' && request.rejection_reason && (
                            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                              <p className="text-sm font-medium mb-1">უარყოფის მიზეზი:</p>
                              <p className="text-sm text-red-800 dark:text-red-200">{request.rejection_reason}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !isPending && setActionDialog({ ...actionDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'approve' && 'VIP მოთხოვნის დამტკიცება'}
              {actionDialog.type === 'reject' && 'VIP მოთხოვნის უარყოფა'}
              {actionDialog.type === 'info' && 'დამატებითი ინფორმაციის მოთხოვნა'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              სერვისი: <strong>{actionDialog.serviceName}</strong>
            </p>
            
            {actionDialog.type === 'approve' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">VIP-ის ვადა</label>
                <Select value={durationDays} onValueChange={setDurationDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 დღე</SelectItem>
                    <SelectItem value="60">60 დღე</SelectItem>
                    <SelectItem value="90">90 დღე</SelectItem>
                    <SelectItem value="permanent">მუდმივი</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {actionDialog.type === 'approve' && 'შეტყობინება (არასავალდებულო)'}
                {actionDialog.type === 'reject' && 'უარყოფის მიზეზი *'}
                {actionDialog.type === 'info' && 'შეტყობინება მექანიკოსისთვის *'}
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  actionDialog.type === 'approve' 
                    ? 'მიუთითეთ დამატებითი ინფორმაცია...'
                    : actionDialog.type === 'reject'
                    ? 'მიუთითეთ რატომ უარყოფთ მოთხოვნას...'
                    : 'მიუთითეთ რა ინფორმაცია გჭირდებათ...'
                }
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ ...actionDialog, open: false })}
              disabled={isPending}
            >
              გაუქმება
            </Button>
            <Button
              onClick={handleSubmitAction}
              disabled={isPending}
              className={
                actionDialog.type === 'reject' 
                  ? 'bg-red-600 hover:bg-red-700'
                  : ''
              }
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  იგზავნება...
                </>
              ) : (
                actionDialog.type === 'approve' ? 'დამტკიცება' :
                actionDialog.type === 'reject' ? 'უარყოფა' :
                'გაგზავნა'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
