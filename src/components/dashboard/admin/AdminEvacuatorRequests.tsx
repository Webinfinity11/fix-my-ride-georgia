import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Search, Trash2, Phone, Download, Truck, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ka } from "date-fns/locale";
import {
  useEvacuatorRequests,
  useUpdateEvacuatorRequestStatus,
  useDeleteEvacuatorRequest,
} from "@/hooks/useEvacuatorRequests";

const statusOptions = [
  { value: "all", label: "ყველა" },
  { value: "new", label: "ახალი" },
  { value: "in_progress", label: "მიმდინარე" },
  { value: "completed", label: "დასრულებული" },
  { value: "cancelled", label: "გაუქმებული" },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "new":
      return <Badge variant="default" className="bg-blue-500">ახალი</Badge>;
    case "in_progress":
      return <Badge variant="default" className="bg-yellow-500">მიმდინარე</Badge>;
    case "completed":
      return <Badge variant="default" className="bg-green-500">დასრულებული</Badge>;
    case "cancelled":
      return <Badge variant="destructive">გაუქმებული</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export const AdminEvacuatorRequests = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: requests = [], isLoading } = useEvacuatorRequests();
  const updateStatus = useUpdateEvacuatorRequestStatus();
  const deleteRequest = useDeleteEvacuatorRequest();

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.phone.includes(searchTerm) ||
      (request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: requests.length,
    new: requests.filter((r) => r.status === "new").length,
    in_progress: requests.filter((r) => r.status === "in_progress").length,
    completed: requests.filter((r) => r.status === "completed").length,
  };

  const exportToCSV = () => {
    const headers = ["თარიღი", "სახელი გვარი", "ტელეფონი", "აღწერა", "სტატუსი"];
    const rows = filteredRequests.map((r) => [
      format(new Date(r.created_at), "dd/MM/yyyy HH:mm"),
      r.full_name,
      r.phone,
      r.description || "-",
      r.status,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `evacuator_requests_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Truck className="h-6 w-6 text-red-600" />
          ევაკუატორის მოთხოვნები
        </h1>
        <Button onClick={exportToCSV} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          CSV ექსპორტი
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-full">
                <Truck className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">სულ</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.new}</p>
                <p className="text-xs text-muted-foreground">ახალი</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Truck className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.in_progress}</p>
                <p className="text-xs text-muted-foreground">მიმდინარე</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">დასრულებული</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ძებნა სახელით, ტელეფონით..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="სტატუსი" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">თარიღი</TableHead>
                  <TableHead className="min-w-[150px]">სახელი გვარი</TableHead>
                  <TableHead className="min-w-[120px]">ტელეფონი</TableHead>
                  <TableHead className="min-w-[200px]">აღწერა</TableHead>
                  <TableHead className="min-w-[120px]">სტატუსი</TableHead>
                  <TableHead className="min-w-[100px]">მოქმედება</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      მოთხოვნები არ მოიძებნა
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="text-xs sm:text-sm">
                        {format(new Date(request.created_at), "dd MMM yyyy, HH:mm", { locale: ka })}
                      </TableCell>
                      <TableCell className="font-medium">{request.full_name}</TableCell>
                      <TableCell>
                        <a
                          href={`tel:${request.phone}`}
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {request.phone}
                        </a>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {request.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={request.status}
                          onValueChange={(value) =>
                            updateStatus.mutate({ id: request.id, status: value })
                          }
                        >
                          <SelectTrigger className="w-[130px] h-8">
                            <SelectValue>{getStatusBadge(request.status)}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">ახალი</SelectItem>
                            <SelectItem value="in_progress">მიმდინარე</SelectItem>
                            <SelectItem value="completed">დასრულებული</SelectItem>
                            <SelectItem value="cancelled">გაუქმებული</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>დარწმუნებული ხართ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                ეს მოქმედება წაშლის მოთხოვნას და მის აღდგენა შეუძლებელი იქნება.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>გაუქმება</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteRequest.mutate(request.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                წაშლა
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
