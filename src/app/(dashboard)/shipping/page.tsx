"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Truck,
  Plus,
  Package,
  Search,
  Printer,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";

interface ShipmentItem {
  id: string;
  quantity: number;
  inventoryItem: { id: string; name: string; lotNumber: string | null };
}

interface Shipment {
  id: string;
  status: string;
  trackingNumber: string | null;
  carrier: string | null;
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
  createdAt: string;
  patient: { id: string; firstName: string; lastName: string; email: string | null };
  items: ShipmentItem[];
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
}

export default function ShippingPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedItems, setSelectedItems] = useState<{ id: string; quantity: number }[]>([]);
  const [address, setAddress] = useState({ line1: "", line2: "", city: "", state: "", zip: "" });
  const [isCreating, setIsCreating] = useState(false);

  const fetchShipments = useCallback(async () => {
    try {
      const res = await fetch("/api/shipments");
      if (res.ok) {
        const data = await res.json();
        setShipments(data.shipments || []);
      }
    } catch {
      // Failed to fetch
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShipments();
    // Also fetch patients and inventory for the create dialog
    fetch("/api/patients?limit=100").then(r => r.ok ? r.json() : null).then(d => {
      if (d?.patients) setPatients(d.patients);
    }).catch(() => {});
    fetch("/api/inventory").then(r => r.ok ? r.json() : null).then(d => {
      if (d?.items) setInventory(d.items);
    }).catch(() => {});
  }, [fetchShipments]);

  const filteredShipments = shipments.filter(
    (s) =>
      `${s.patient.firstName} ${s.patient.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      s.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = shipments.filter((s) => s.status === "PENDING").length;
  const shippedCount = shipments.filter((s) => s.status === "SHIPPED").length;
  const deliveredCount = shipments.filter((s) => s.status === "DELIVERED").length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED": return "default";
      case "SHIPPED": return "secondary";
      case "PACKED": return "outline";
      default: return "outline";
    }
  };

  const addItem = () => {
    setSelectedItems([...selectedItems, { id: "", quantity: 1 }]);
  };

  const updateItem = (index: number, field: "id" | "quantity", value: string | number) => {
    const newItems = [...selectedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setSelectedItems(newItems);
  };

  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!selectedPatient || selectedItems.length === 0 || !address.line1 || !address.city || !address.state || !address.zip) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient,
          addressLine1: address.line1,
          addressLine2: address.line2 || null,
          city: address.city,
          state: address.state,
          zip: address.zip,
          items: selectedItems.filter(i => i.id).map(i => ({
            inventoryItemId: i.id,
            quantity: i.quantity,
          })),
        }),
      });
      if (res.ok) {
        setCreateDialogOpen(false);
        setSelectedPatient("");
        setSelectedItems([]);
        setAddress({ line1: "", line2: "", city: "", state: "", zip: "" });
        fetchShipments();
      }
    } catch {
      // Failed
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Shipping</h2>
          <p className="text-muted-foreground">
            Manage patient shipments and kit fulfillment
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Shipment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Shipment</DialogTitle>
              <DialogDescription>
                Select a patient and items to ship
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Patient</Label>
                <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Items to Ship</Label>
                  <Button variant="outline" size="sm" onClick={addItem}>
                    <Plus className="mr-2 h-3 w-3" />
                    Add Item
                  </Button>
                </div>
                {selectedItems.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                    No items added yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedItems.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Select
                          value={item.id}
                          onValueChange={(v) => updateItem(index, "id", v)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            {inventory.map((inv) => (
                              <SelectItem key={inv.id} value={inv.id}>
                                {inv.name} ({inv.quantity} in stock)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, "quantity", parseInt(e.target.value))
                          }
                          className="w-20"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Address Line 1</Label>
                  <Input
                    placeholder="123 Main St"
                    value={address.line1}
                    onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address Line 2</Label>
                  <Input
                    placeholder="Apt 4B"
                    value={address.line2}
                    onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    placeholder="San Diego"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    placeholder="CA"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>ZIP</Label>
                  <Input
                    placeholder="92101"
                    value={address.zip}
                    onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Shipment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Shipments</p>
                <p className="text-2xl font-bold">{shipments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Transit</p>
                <p className="text-2xl font-bold">{shippedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald/10">
                <CheckCircle2 className="h-6 w-6 text-emerald" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold">{deliveredCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shipments Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Shipments</CardTitle>
              <CardDescription>
                {shipments.length === 0
                  ? "No shipments yet. Create one to get started."
                  : `${filteredShipments.length} shipments`}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search shipments..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {shipments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">No shipments created yet</p>
              <p className="text-xs mt-1">Create a shipment to send items to patients</p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tracking</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {shipment.patient.firstName} {shipment.patient.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {shipment.patient.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {shipment.items.map((item) => (
                            <div key={item.id} className="text-sm">
                              <span className="font-medium">{item.inventoryItem.name}</span>
                              <span className="text-muted-foreground"> x{item.quantity}</span>
                              {item.inventoryItem.lotNumber && (
                                <span className="text-xs text-muted-foreground block">
                                  Lot: {item.inventoryItem.lotNumber}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(shipment.status)}>
                          {shipment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {shipment.trackingNumber ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">
                              {shipment.trackingNumber.slice(0, 10)}...
                            </span>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(shipment.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Printer className="mr-2 h-3 w-3" />
                            Packing List
                          </Button>
                          {shipment.status === "PENDING" && (
                            <Button size="sm">Ship</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
