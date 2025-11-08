import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  mechanic_services?: {
    name: string;
    city: string | null;
    district: string | null;
  };
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  };
}

// Get mechanic's VIP request for a service
export function useServiceVIPRequest(serviceId: number) {
  return useQuery({
    queryKey: ['vip-request', serviceId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('არ ხართ ავტორიზებული');

      const { data, error } = await (supabase as any)
        .from('vip_requests')
        .select('*')
        .eq('service_id', serviceId)
        .eq('mechanic_id', user.id)
        .in('status', ['pending', 'need_info'])
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as VIPRequest | null;
    },
  });
}

// Create VIP request
export function useCreateVIPRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: { 
      serviceId: number; 
      plan: VIPPlanType; 
      message?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('არ ხართ ავტორიზებული');

      const { data, error } = await (supabase as any)
        .from('vip_requests')
        .insert({
          service_id: params.serviceId,
          mechanic_id: user.id,
          requested_plan: params.plan,
          message: params.message || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vip-request', variables.serviceId] });
      toast.success('VIP მოთხოვნა წარმატებით გაიგზავნა!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'მოთხოვნის გაგზავნა ვერ მოხერხდა');
    },
  });
}

// Get all VIP requests (Admin only)
export function useAllVIPRequests(status?: VIPRequestStatus) {
  return useQuery({
    queryKey: ['admin-vip-requests', status],
    queryFn: async () => {
      let query = (supabase as any)
        .from('vip_requests')
        .select(`
          *,
          mechanic_services (
            name,
            city,
            district
          ),
          profiles (
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .order('requested_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as VIPRequest[];
    },
  });
}

// Admin approve VIP request
export function useApproveVIPRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: { 
      requestId: string; 
      durationDays: number | null; 
      message?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('არ ხართ ავტორიზებული');

      // Get the request details
      const { data: request, error: fetchError } = await (supabase as any)
        .from('vip_requests')
        .select('service_id, requested_plan')
        .eq('id', params.requestId)
        .single();

      if (fetchError) throw fetchError;

      const now = new Date();
      const vipEndsAt = params.durationDays 
        ? new Date(now.getTime() + params.durationDays * 24 * 60 * 60 * 1000)
        : null;

      // Update VIP request
      const { error: updateError } = await (supabase as any)
        .from('vip_requests')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: now.toISOString(),
          admin_message: params.message || null,
          approved_duration_days: params.durationDays,
          vip_starts_at: now.toISOString(),
          vip_ends_at: vipEndsAt?.toISOString() || null,
        })
        .eq('id', params.requestId);

      if (updateError) throw updateError;

      // Update service with VIP status
      const { error: serviceError } = await (supabase as any)
        .from('mechanic_services')
        .update({
          vip_status: request.requested_plan,
          vip_until: vipEndsAt?.toISOString() || null,
          is_vip_active: true,
        })
        .eq('id', request.service_id);

      if (serviceError) throw serviceError;

      return { requestId: params.requestId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vip-requests'] });
      toast.success('VIP მოთხოვნა დამტკიცდა!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'დამტკიცება ვერ მოხერხდა');
    },
  });
}

// Admin reject VIP request
export function useRejectVIPRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: { 
      requestId: string; 
      reason: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('არ ხართ ავტორიზებული');

      const { error } = await (supabase as any)
        .from('vip_requests')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: params.reason,
        })
        .eq('id', params.requestId);

      if (error) throw error;
      return { requestId: params.requestId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vip-requests'] });
      toast.success('VIP მოთხოვნა უარყოფილია');
    },
    onError: (error: any) => {
      toast.error(error.message || 'უარყოფა ვერ მოხერხდა');
    },
  });
}

// Admin request more info
export function useRequestVIPInfo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: { 
      requestId: string; 
      message: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('არ ხართ ავტორიზებული');

      const { error } = await (supabase as any)
        .from('vip_requests')
        .update({
          status: 'need_info',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_message: params.message,
        })
        .eq('id', params.requestId);

      if (error) throw error;
      return { requestId: params.requestId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vip-requests'] });
      toast.success('შეტყობინება გაიგზავნა');
    },
    onError: (error: any) => {
      toast.error(error.message || 'გაგზავნა ვერ მოხერხდა');
    },
  });
}
