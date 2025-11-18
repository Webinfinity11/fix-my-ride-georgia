import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Search, Phone, FileText, DollarSign, Car, Shield, Trash2, Download } from "lucide-react";
import { format } from "date-fns";

interface AutoLead {
  id: string;
  full_name: string;
  phone: string;
  comment: string | null;
  lead_type: 'leasing' | 'dealers' | 'insurance';
  status: 'new' | 'contacted' | 'converted' | 'rejected';
  created_at: string;
  updated_at: string;
}

const AdminLeads = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: leads, isLoading } = useQuery({
    queryKey: ['admin-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auto_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching leads:', error);
        throw error;
      }
      return data as AutoLead[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: string }) => {
      const { error } = await supabase
        .from('auto_leads')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
      toast.success('სტატუსი განახლდა');
    },
    onError: (error) => {
      console.error('Error updating status:', error);
      toast.error('სტატუსის განახლება ვერ მოხერხდა');
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase
        .from('auto_leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
      toast.success('ლიდი წაიშალა');
    },
    onError: (error) => {
      console.error('Error deleting lead:', error);
      toast.error('ლიდის წაშლა ვერ მოხერხდა');
    },
  });

  const filteredLeads = leads?.filter(lead => {
    const matchesSearch =
      lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);
    const matchesType = typeFilter === "all" || lead.lead_type === typeFilter;
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getLeadTypeIcon = (type: string) => {
    switch (type) {
      case 'leasing':
        return <DollarSign className="h-4 w-4" />;
      case 'dealers':
        return <Car className="h-4 w-4" />;
      case 'insurance':
        return <Shield className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getLeadTypeLabel = (type: string) => {
    switch (type) {
      case 'leasing':
        return 'ლიზინგი';
      case 'dealers':
        return 'დილერები';
      case 'insurance':
        return 'დაზღვევა';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { label: 'ახალი', color: 'bg-blue-500' },
      contacted: { label: 'დაკავშირებული', color: 'bg-yellow-500' },
      converted: { label: 'კონვერტირებული', color: 'bg-green-500' },
      rejected: { label: 'უარყოფილი', color: 'bg-red-500' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-gray-500' };
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  const getStatusLabel = (status: string) => {
    const statusLabels = {
      new: 'ახალი',
      contacted: 'დაკავშირებული',
      converted: 'კონვერტირებული',
      rejected: 'უარყოფილი',
    };
    return statusLabels[status as keyof typeof statusLabels] || status;
  };

  const exportToCSV = () => {
    if (!filteredLeads || filteredLeads.length === 0) {
      toast.error('ექსპორტისთვის ლიდები არ არის');
      return;
    }

    // CSV headers
    const headers = ['თარიღი', 'ტიპი', 'სახელი და გვარი', 'ტელეფონი', 'კომენტარი', 'სტატუსი'];

    // Convert leads to CSV rows
    const rows = filteredLeads.map(lead => [
      format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm'),
      getLeadTypeLabel(lead.lead_type),
      lead.full_name,
      lead.phone,
      lead.comment || '-',
      getStatusLabel(lead.status),
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Add BOM for UTF-8 encoding (for Georgian characters)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('CSV ფაილი ჩამოიტვირთა');
  };

  const stats = {
    total: leads?.length || 0,
    new: leads?.filter(l => l.status === 'new').length || 0,
    contacted: leads?.filter(l => l.status === 'contacted').length || 0,
    converted: leads?.filter(l => l.status === 'converted').length || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ლიდების მართვა</h1>
        <p className="text-gray-600 mt-2">
          ლიზინგის, დილერებისა და დაზღვევის ლიდები
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-600">სულ ლიდები</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
            <div className="text-sm text-gray-600">ახალი</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.contacted}</div>
            <div className="text-sm text-gray-600">დაკავშირებული</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.converted}</div>
            <div className="text-sm text-gray-600">კონვერტირებული</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>ფილტრები</CardTitle>
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="flex items-center gap-2"
            disabled={!filteredLeads || filteredLeads.length === 0}
          >
            <Download className="h-4 w-4" />
            CSV ექსპორტი
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ძებნა..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="ტიპი" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ყველა ტიპი</SelectItem>
                <SelectItem value="leasing">ლიზინგი</SelectItem>
                <SelectItem value="dealers">დილერები</SelectItem>
                <SelectItem value="insurance">დაზღვევა</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="სტატუსი" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ყველა სტატუსი</SelectItem>
                <SelectItem value="new">ახალი</SelectItem>
                <SelectItem value="contacted">დაკავშირებული</SelectItem>
                <SelectItem value="converted">კონვერტირებული</SelectItem>
                <SelectItem value="rejected">უარყოფილი</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>ლიდები ({filteredLeads?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : filteredLeads && filteredLeads.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>თარიღი</TableHead>
                    <TableHead>ტიპი</TableHead>
                    <TableHead>სახელი და გვარი</TableHead>
                    <TableHead>ტელეფონი</TableHead>
                    <TableHead>კომენტარი</TableHead>
                    <TableHead>სტატუსი</TableHead>
                    <TableHead>მოქმედება</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="text-sm">
                        {format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getLeadTypeIcon(lead.lead_type)}
                          <span className="text-sm font-medium">
                            {getLeadTypeLabel(lead.lead_type)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{lead.full_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                            {lead.phone}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {lead.comment || '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(lead.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={lead.status}
                            onValueChange={(value) =>
                              updateStatusMutation.mutate({ leadId: lead.id, status: value })
                            }
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">ახალი</SelectItem>
                              <SelectItem value="contacted">დაკავშირებული</SelectItem>
                              <SelectItem value="converted">კონვერტირებული</SelectItem>
                              <SelectItem value="rejected">უარყოფილი</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('დარწმუნებული ხართ რომ გსურთ ლიდის წაშლა?')) {
                                deleteLeadMutation.mutate(lead.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              ლიდები არ მოიძებნა
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLeads;
