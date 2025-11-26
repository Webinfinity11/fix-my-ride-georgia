import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  usePartsOrders,
  useUpdatePartsOrderStatus,
  useDeletePartsOrder,
} from "@/hooks/usePartsOrders";
import { Package, Phone, Car, Wrench, Trash2, Download } from "lucide-react";
import { format } from "date-fns";

export const AdminPartsOrders = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: orders, isLoading } = usePartsOrders();
  const updateStatus = useUpdatePartsOrderStatus();
  const deleteOrder = useDeletePartsOrder();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      new: "default",
      contacted: "secondary",
      completed: "secondary",
      rejected: "destructive",
    };
    
    const labels: Record<string, string> = {
      new: "ახალი",
      contacted: "დაკავშირებული",
      completed: "დასრულებული",
      rejected: "უარყოფილი",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const filteredOrders = orders?.filter((order) => {
    const matchesSearch =
      order.full_name.toLowerCase().includes(search.toLowerCase()) ||
      order.phone.includes(search) ||
      order.car_brand.toLowerCase().includes(search.toLowerCase()) ||
      order.part_name.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders?.length || 0,
    new: orders?.filter((o) => o.status === "new").length || 0,
    contacted: orders?.filter((o) => o.status === "contacted").length || 0,
    completed: orders?.filter((o) => o.status === "completed").length || 0,
  };

  const exportToCSV = () => {
    if (!filteredOrders) return;
    
    const headers = ["თარიღი", "სახელი", "ტელეფონი", "მანქანა", "ნაწილი", "სტატუსი"];
    const rows = filteredOrders.map((order) => [
      format(new Date(order.created_at), "dd/MM/yyyy HH:mm"),
      order.full_name,
      order.phone,
      `${order.car_brand} ${order.car_model} ${order.car_year || ""}`.trim(),
      order.part_name,
      order.status,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `parts_orders_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  if (isLoading) {
    return <div>იტვირთება...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              სულ შეკვეთები
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ახალი
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="default">{stats.new}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              დაკავშირებული
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{stats.contacted}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              დასრულებული
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{stats.completed}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <CardTitle>ნაწილების შეკვეთები</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Input
                placeholder="ძებნა..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ყველა</SelectItem>
                  <SelectItem value="new">ახალი</SelectItem>
                  <SelectItem value="contacted">დაკავშირებული</SelectItem>
                  <SelectItem value="completed">დასრულებული</SelectItem>
                  <SelectItem value="rejected">უარყოფილი</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={exportToCSV}
                title="ექსპორტი CSV"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>თარიღი</TableHead>
                  <TableHead>სახელი</TableHead>
                  <TableHead>ტელეფონი</TableHead>
                  <TableHead>მანქანა</TableHead>
                  <TableHead>ნაწილი</TableHead>
                  <TableHead>სტატუსი</TableHead>
                  <TableHead>მოქმედება</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="font-medium">{order.full_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {order.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        <span className="text-sm">
                          {order.car_brand} {order.car_model}
                          {order.car_year && ` (${order.car_year})`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Wrench className="h-3 w-3" />
                        {order.part_name}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Select
                          value={order.status}
                          onValueChange={(value) =>
                            updateStatus.mutate({ id: order.id, status: value })
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">ახალი</SelectItem>
                            <SelectItem value="contacted">დაკავშირებული</SelectItem>
                            <SelectItem value="completed">დასრულებული</SelectItem>
                            <SelectItem value="rejected">უარყოფილი</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => deleteOrder.mutate(order.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
