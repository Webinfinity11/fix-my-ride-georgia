// TEMPORARY STUB - VIP system migration not yet executed
// This file will be restored after database migration is complete

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

// STUB: Get mechanic's VIP request for a service
export function useServiceVIPRequest(serviceId: number) {
  return useQuery({
    queryKey: ['vip-request', serviceId],
    queryFn: async () => null,
    enabled: false, // Disabled until migration is complete
  });
}

// STUB: Create VIP request
export function useCreateVIPRequest() {
  return useMutation({
    mutationFn: async (_params: { 
      serviceId: number; 
      plan: VIPPlanType; 
      message?: string;
    }) => {
      throw new Error('VIP სისტემა ჯერ არ არის აქტიური. გთხოვთ დაელოდოთ მიგრაციას.');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
}

// STUB: Get all VIP requests (Admin only)
export function useAllVIPRequests(status?: VIPRequestStatus) {
  return useQuery({
    queryKey: ['admin-vip-requests', status],
    queryFn: async () => [],
    enabled: false, // Disabled until migration is complete
  });
}

// STUB: Admin approve VIP request
export function useApproveVIPRequest() {
  return useMutation({
    mutationFn: async (_params: { 
      requestId: string; 
      durationDays: number | null; 
      message?: string;
    }) => {
      throw new Error('VIP სისტემა ჯერ არ არის აქტიური.');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
}

// STUB: Admin reject VIP request
export function useRejectVIPRequest() {
  return useMutation({
    mutationFn: async (_params: { 
      requestId: string; 
      reason: string;
    }) => {
      throw new Error('VIP სისტემა ჯერ არ არის აქტიური.');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
}

// STUB: Admin request more info
export function useRequestVIPInfo() {
  return useMutation({
    mutationFn: async (_params: { 
      requestId: string; 
      message: string;
    }) => {
      throw new Error('VIP სისტემა ჯერ არ არის აქტიური.');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
}
