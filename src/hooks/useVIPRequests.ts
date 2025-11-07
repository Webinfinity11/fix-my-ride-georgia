import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type VIPPlanType = 'vip' | 'super_vip';
export type VIPRequestStatus = 'pending' | 'approved' | 'rejected' | 'need_info' | 'expired';

export interface VIPRequest {
  id: string;
  service_id: number;
  mechanic_id: string;
  requested_plan: VIPPlanType;
  status: VIPRequestStatus;
  requested_at: string;
  message: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_message: string | null;
  rejection_reason: string | null;
  approved_duration_days: number | null;
  vip_starts_at: string | null;
  vip_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

// Get mechanic's VIP request for a service
export function useServiceVIPRequest(serviceId: number) {
  return useQuery({
    queryKey: ['vip-request', serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vip_requests')
        .select('*')
        .eq('service_id', serviceId)
        .in('status', ['pending', 'need_info'])
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (error) throw error;
      return data as VIPRequest | null;
    },
    enabled: !!serviceId,
  });
}

// Create VIP request
export function useCreateVIPRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      serviceId, 
      plan, 
      message 
    }: { 
      serviceId: number; 
      plan: VIPPlanType; 
      message?: string;
    }) => {
      const { data, error } = await supabase.rpc('create_vip_request', {
        p_service_id: serviceId,
        p_requested_plan: plan,
        p_message: message || null,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vip-request', variables.serviceId] });
      queryClient.invalidateQueries({ queryKey: ['mechanic-services'] });
      toast.success('VIP მოთხოვნა წარმატებით გაიგზავნა!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'შეცდომა მოთხოვნის გაგზავნისას');
    },
  });
}

// Get all VIP requests (Admin only)
export function useAllVIPRequests(status?: VIPRequestStatus) {
  return useQuery({
    queryKey: ['admin-vip-requests', status],
    queryFn: async () => {
      let query = supabase
        .from('vip_requests')
        .select(`
          *,
          mechanic_services (
            id,
            name,
            city,
            district
          ),
          profiles!vip_requests_mechanic_id_fkey (
            first_name,
            last_name,
            phone,
            email
          )
        `)
        .order('requested_at', { ascending: false });
        
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });
}

// Admin approve VIP request
export function useApproveVIPRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      requestId, 
      durationDays, 
      message 
    }: { 
      requestId: string; 
      durationDays: number | null; 
      message?: string;
    }) => {
      const { data, error } = await supabase.rpc('approve_vip_request', {
        p_request_id: requestId,
        p_duration_days: durationDays,
        p_admin_message: message || null,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vip-requests'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('VIP მოთხოვნა წარმატებით დამტკიცდა!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'შეცდომა დამტკიცებისას');
    },
  });
}

// Admin reject VIP request
export function useRejectVIPRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      requestId, 
      reason 
    }: { 
      requestId: string; 
      reason: string;
    }) => {
      const { data, error } = await supabase.rpc('reject_vip_request', {
        p_request_id: requestId,
        p_rejection_reason: reason,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vip-requests'] });
      toast.success('მოთხოვნა უარყოფილია');
    },
    onError: (error: any) => {
      toast.error(error.message || 'შეცდომა უარყოფისას');
    },
  });
}

// Admin request more info
export function useRequestVIPInfo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      requestId, 
      message 
    }: { 
      requestId: string; 
      message: string;
    }) => {
      const { data, error } = await supabase.rpc('request_vip_info', {
        p_request_id: requestId,
        p_admin_message: message,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vip-requests'] });
      toast.success('შეტყობინება წარმატებით გაიგზავნა');
    },
    onError: (error: any) => {
      toast.error(error.message || 'შეცდომა გაგზავნისას');
    },
  });
}
