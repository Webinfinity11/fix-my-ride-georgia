import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bookmark, ExternalLink, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createSlug } from '@/utils/slugUtils';

interface SavedService {
  id: string;
  created_at: string;
  notes: string | null;
  service: {
    id: number;
    name: string;
    slug: string;
    city: string | null;
    district: string | null;
  };
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
}

export const SavedServicesManagement = () => {
  const [savedServices, setSavedServices] = useState<SavedService[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSavedServices();
  }, []);

  const fetchSavedServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_services')
        .select(`
          id,
          created_at,
          notes,
          service:mechanic_services(
            id,
            name,
            slug,
            city,
            district
          ),
          user:profiles(
            id,
            first_name,
            last_name,
            email,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      console.log('Fetched saved services:', data);
      setSavedServices((data as any) || []);
    } catch (error: any) {
      console.error('Error fetching saved services:', error);
      toast.error('შენახული სერვისების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  };

  const handleViewService = (slug: string) => {
    navigate(`/service/${slug}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ka-GE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            შენახული სერვისები
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bookmark className="h-5 w-5" />
          შენახული სერვისები
          <Badge variant="secondary" className="ml-2">
            {savedServices.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {savedServices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>შენახული სერვისები არ არის</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>სერვისი</TableHead>
                  <TableHead>მომხმარებელი</TableHead>
                  <TableHead>ლოკაცია</TableHead>
                  <TableHead>შენახვის თარიღი</TableHead>
                  <TableHead className="text-right">მოქმედება</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {savedServices.map((saved) => (
                  <TableRow key={saved.id}>
                    <TableCell className="font-medium">
                      {saved.service?.name || 'უცნობი სერვისი'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {saved.user?.first_name} {saved.user?.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {saved.user?.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {saved.service?.city && (
                        <div className="text-sm">
                          {saved.service.city}
                          {saved.service.district && `, ${saved.service.district}`}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(saved.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewService(saved.service?.slug || '')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        ნახვა
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SavedServicesManagement;