import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, Eye, AlertTriangle, CheckCircle, Loader2, Pin, PinOff } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ka } from 'date-fns/locale';
import { useTogglePin } from '@/hooks/useCommunityPosts';

interface Post {
  id: string;
  content: string;
  author_name: string;
  created_at: string;
  is_deleted: boolean;
  like_count: number;
  comment_count: number;
  is_pinned: boolean;
}

interface Report {
  id: string;
  post_id: string;
  reason: string;
  details: string | null;
  reporter_name: string;
  status: string;
  created_at: string;
  post_content: string;
}

export function AdminCommunity() {
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const queryClient = useQueryClient();
  const togglePinMutation = useTogglePin();
  
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      // Fetch author profiles separately
      const authorIds = [...new Set((data || []).map(p => p.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', authorIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]));
      
      return (data || []).map(post => {
        const profile = profileMap.get(post.author_id);
        return {
          id: post.id,
          content: post.content || '',
          author_name: profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'User',
          created_at: post.created_at,
          is_deleted: post.is_deleted,
          like_count: 0,
          comment_count: 0,
          is_pinned: post.is_pinned || false
        };
      }) as Post[];
    }
  });
  
  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      // Fetch related data separately
      const reporterIds = [...new Set((data || []).map(r => r.reporter_id))];
      const postIds = [...new Set((data || []).map(r => r.post_id))];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', reporterIds);
        
      const { data: posts } = await supabase
        .from('posts')
        .select('id, content')
        .in('id', postIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]));
      const postMap = new Map(posts?.map(p => [p.id, p]));
      
      return (data || []).map(report => {
        const profile = profileMap.get(report.reporter_id);
        const post = postMap.get(report.post_id);
        return {
          id: report.id,
          post_id: report.post_id,
          reason: report.reason,
          details: report.details,
          reporter_name: profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'User',
          status: report.status,
          created_at: report.created_at,
          post_content: post?.content || ''
        };
      }) as Report[];
    }
  });
  
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('posts')
        .update({ is_deleted: true })
        .eq('id', postId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      toast.success('პოსტი წაიშალა');
      setDeletePostId(null);
    },
    onError: () => {
      toast.error('წაშლა ვერ მოხერხდა');
    }
  });
  
  const updateReportMutation = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: 'pending' | 'reviewed' | 'dismissed' | 'deleted' | 'hidden' }) => {
      const { error } = await supabase
        .from('post_reports')
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq('id', reportId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      toast.success('რეპორტი განახლდა');
      setSelectedReport(null);
    },
    onError: () => {
      toast.error('განახლება ვერ მოხერხდა');
    }
  });
  
  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      spam: 'სპამი',
      harassment: 'შეურაცხყოფა',
      hate_speech: 'სიძულვილის ენა',
      violence: 'ძალადობა',
      misinformation: 'არასწორი ინფო',
      inappropriate: 'შეუსაბამო',
      other: 'სხვა'
    };
    return labels[reason] || reason;
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Community მართვა</h2>
        <p className="text-muted-foreground">პოსტების და რეპორტების მოდერაცია</p>
      </div>
      
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posts">პოსტები</TabsTrigger>
          <TabsTrigger value="reports">
            რეპორტები
            {reports && reports.filter(r => r.status === 'pending').length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {reports.filter(r => r.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="space-y-4">
          {postsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : posts && posts.length > 0 ? (
            posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{post.author_name}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(post.created_at), { 
                            addSuffix: true,
                            locale: ka 
                          })}
                        </span>
                        {post.is_deleted && (
                          <Badge variant="destructive">წაშლილი</Badge>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap line-clamp-3">{post.content}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(`/community`, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!post.is_deleted && (
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => setDeletePostId(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-12">პოსტები არაა</p>
          )}
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          {reportsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : reports && reports.length > 0 ? (
            reports.map((report) => (
              <Card key={report.id}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={report.status === 'pending' ? 'destructive' : 'secondary'}>
                            {getReasonLabel(report.reason)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {report.reporter_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(report.created_at), { 
                              addSuffix: true,
                              locale: ka 
                            })}
                          </span>
                        </div>
                        {report.details && (
                          <p className="text-sm text-muted-foreground mb-2">{report.details}</p>
                        )}
                        <p className="text-sm bg-muted/30 p-2 rounded line-clamp-2">
                          {report.post_content}
                        </p>
                      </div>
                      {report.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateReportMutation.mutate({ 
                              reportId: report.id, 
                              status: 'reviewed' 
                            })}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            მიღება
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setDeletePostId(report.post_id);
                              updateReportMutation.mutate({ 
                                reportId: report.id, 
                                status: 'reviewed' 
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            წაშლა
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-12">რეპორტები არაა</p>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePostId} onOpenChange={() => setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>დარწმუნებული ხართ?</AlertDialogTitle>
            <AlertDialogDescription>
              პოსტი წაიშლება და ვეღარ აღდგება.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>გაუქმება</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePostId && deletePostMutation.mutate(deletePostId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              წაშლა
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
