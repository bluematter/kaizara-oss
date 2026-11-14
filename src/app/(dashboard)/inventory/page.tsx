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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  AlertTriangle,
  Package,
  Mail,
  Download,
  Thermometer,
  TrendingUp,
  DollarSign,
  Filter,
  Loader2,
  Trash2,
} from "lucide-react";
// Real data only - no mock imports
import { format, differenceInDays } from "date-fns";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  lotNumber: string;
  expirationDate: string | Date;
  quantity: number;
  minStock: number;
  unitPrice: number | null;
  costPrice: number | null;
  supplier: string | null;
  category: string | null;
  storageTemp: string | null;
  notes?: string | null;
}

function calcFinancials(items: InventoryItem[]) {
  let totalCostValue = 0;
  let totalRetailValue = 0;
  let totalPotentialProfit = 0;
  let marginCount = 0;
  let totalMargin = 0;

  for (const item of items) {
    const cost = (item.costPrice || 0) * item.quantity;
    const retail = (item.unitPrice || 0) * item.quantity;
    totalCostValue += cost;
    totalRetailValue += retail;
    totalPotentialProfit += retail - cost;
    if (item.unitPrice && item.costPrice) {
      totalMargin += ((item.unitPrice - item.costPrice) / item.unitPrice) * 100;
      marginCount++;
    }
  }

  return {
    totalCostValue,
    totalRetailValue,
    totalPotentialProfit,
    averageMargin: marginCount > 0 ? totalMargin / marginCount : 0,
  };
}

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [addStockDialogOpen, setAddStockDialogOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Add stock form state
  const [newItem, setNewItem] = useState({
    name: "",
    sku: "",
    lotNumber: "",
    expirationDate: "",
    quantity: "",
    minStock: "5",
    costPrice: "",
    unitPrice: "",
    supplier: "",
  });

  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch("/api/inventory");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setInventory(data.items || []);
    } catch {
      setInventory([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleAddItem = async () => {
    setFormError("");

    if (!newItem.name.trim()) {
      setFormError("Product name is required");
      return;
    }
    if (!newItem.expirationDate) {
      setFormError("Expiration date is required");
      return;
    }
    if (!newItem.quantity || parseInt(newItem.quantity) < 0) {
      setFormError("Quantity must be 0 or more");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      if (res.ok) {
        setAddStockDialogOpen(false);
        setFormError("");
        setNewItem({
          name: "",
          sku: "",
          lotNumber: "",
          expirationDate: "",
          quantity: "",
          minStock: "5",
          costPrice: "",
          unitPrice: "",
          supplier: "",
        });
        fetchInventory();
      } else {
        const data = await res.json();
        setFormError(data.error || "Failed to add item");
      }
    } catch {
      setFormError("Network error — please try again");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateItem = async (id: string, data: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setEditingItemId(null);
        fetchInventory();
      }
    } catch {
      // handle error
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEditingItemId(null);
        fetchInventory();
      }
    } catch {
      // handle error
    }
  };

  const displayItems = inventory;

  const categories = Array.from(
    new Set(displayItems.map((item) => item.category || "Other"))
  ).sort();

  const filteredInventory = displayItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.lotNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = displayItems.filter(
    (item) => item.quantity <= item.minStock
  ).length;
  const expiringCount = displayItems.filter(
    (item) =>
      differenceInDays(new Date(item.expirationDate), new Date()) <= 30
  ).length;

  const financials = calcFinancials(inventory);

  const getStockStatus = (item: { quantity: number; minStock: number }) => {
    if (item.quantity === 0) return "out";
    if (item.quantity <= item.minStock) return "low";
    return "ok";
  };

  const getExpirationStatus = (date: string | Date) => {
    const days = differenceInDays(new Date(date), new Date());
    if (days <= 0) return "expired";
    if (days <= 30) return "expiring";
    return "ok";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
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
          <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
          <p className="text-muted-foreground">
            Manage peptides, IV supplies, nutrients, and medications
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            Reorder Report
          </Button>
          <Dialog open={addStockDialogOpen} onOpenChange={setAddStockDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Stock
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Inventory Item</DialogTitle>
                <DialogDescription>
                  Enter the details for the new stock item
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {formError && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                    <p className="text-sm text-destructive">{formError}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. BPC-157 5mg vial"
                    value={newItem.name}
                    onChange={(e) =>
                      setNewItem({ ...newItem, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Units in Stock *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="10"
                      value={newItem.quantity}
                      onChange={(e) =>
                        setNewItem({ ...newItem, quantity: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      How many units are you adding?
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiration">Expiration Date *</Label>
                    <Input
                      id="expiration"
                      type="date"
                      value={newItem.expirationDate}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          expirationDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="costPrice">Your Cost ($)</Label>
                    <Input
                      id="costPrice"
                      type="number"
                      step="0.01"
                      placeholder="32.50"
                      value={newItem.costPrice}
                      onChange={(e) =>
                        setNewItem({ ...newItem, costPrice: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      What you pay per unit
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="retailPrice">Patient Price ($)</Label>
                    <Input
                      id="retailPrice"
                      type="number"
                      step="0.01"
                      placeholder="89.99"
                      value={newItem.unitPrice}
                      onChange={(e) =>
                        setNewItem({ ...newItem, unitPrice: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      What the patient pays
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      placeholder="e.g. Peptide Sciences"
                      value={newItem.supplier}
                      onChange={(e) =>
                        setNewItem({ ...newItem, supplier: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minStock">Low Stock Alert</Label>
                    <Input
                      id="minStock"
                      type="number"
                      placeholder="5"
                      value={newItem.minStock}
                      onChange={(e) =>
                        setNewItem({ ...newItem, minStock: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Alert when stock drops below this
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      placeholder="Auto-generated if blank"
                      value={newItem.sku}
                      onChange={(e) =>
                        setNewItem({ ...newItem, sku: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lot">Lot Number</Label>
                    <Input
                      id="lot"
                      placeholder="Auto-generated if blank"
                      value={newItem.lotNumber}
                      onChange={(e) =>
                        setNewItem({ ...newItem, lotNumber: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setAddStockDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddItem} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Item"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total SKUs
                </p>
                <p className="text-2xl font-bold">{displayItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  lowStockCount > 0 ? "bg-destructive/10" : "bg-emerald/10"
                }`}
              >
                <AlertTriangle
                  className={`h-6 w-6 ${
                    lowStockCount > 0 ? "text-destructive" : "text-emerald"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Low Stock
                </p>
                <p className="text-2xl font-bold">{lowStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  expiringCount > 0 ? "bg-warning/10" : "bg-emerald/10"
                }`}
              >
                <Thermometer
                  className={`h-6 w-6 ${
                    expiringCount > 0 ? "text-warning" : "text-emerald"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Expiring Soon
                </p>
                <p className="text-2xl font-bold">{expiringCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                <DollarSign className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Cost
                </p>
                <p className="text-2xl font-bold">
                  $
                  {financials.totalCostValue.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Retail Value
                </p>
                <p className="text-2xl font-bold">
                  $
                  {financials.totalRetailValue.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Profit Margin
                </p>
                <p className="text-2xl font-bold text-emerald-500">
                  {financials.averageMargin.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  $
                  {financials.totalPotentialProfit.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}{" "}
                  potential
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Items</CardTitle>
              <CardDescription>
                {filteredInventory.length} items in inventory
              </CardDescription>
            </div>
            <div className="flex gap-3">
              <Select
                value={categoryFilter}
                onValueChange={setCategoryFilter}
              >
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, SKU, lot..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table className="min-w-[1000px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU / Lot</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Storage</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Retail</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {searchQuery
                        ? "No items match your search"
                        : "No inventory items yet. Add your first item to get started."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map((item) => {
                    const stockStatus = getStockStatus(item);
                    const expStatus = getExpirationStatus(
                      item.expirationDate
                    );

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.supplier}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">{item.sku}</div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {item.lotNumber}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.category}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div
                            className={`text-lg font-semibold ${
                              stockStatus === "out"
                                ? "text-destructive"
                                : stockStatus === "low"
                                ? "text-warning"
                                : ""
                            }`}
                          >
                            {item.quantity}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            min: {item.minStock}
                          </div>
                          {stockStatus !== "ok" && (
                            <Badge
                              variant={
                                stockStatus === "out"
                                  ? "destructive"
                                  : "outline"
                              }
                              className="mt-1 text-xs"
                            >
                              {stockStatus === "out"
                                ? "Out of Stock"
                                : "Low Stock"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div
                            className={
                              expStatus === "expired"
                                ? "text-destructive"
                                : expStatus === "expiring"
                                ? "text-warning"
                                : ""
                            }
                          >
                            {format(
                              new Date(item.expirationDate),
                              "MMM d, yyyy"
                            )}
                          </div>
                          {expStatus !== "ok" && (
                            <Badge
                              variant={
                                expStatus === "expired"
                                  ? "destructive"
                                  : "outline"
                              }
                              className="mt-1 text-xs"
                            >
                              {expStatus === "expired"
                                ? "Expired"
                                : `${differenceInDays(
                                    new Date(item.expirationDate),
                                    new Date()
                                  )} days`}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.storageTemp === "Refrigerated"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {item.storageTemp}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-medium text-muted-foreground">
                            $
                            {(
                              (item.costPrice || 0) * item.quantity
                            ).toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ${item.costPrice?.toFixed(2)}/unit
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-medium">
                            $
                            {(
                              (item.unitPrice || 0) * item.quantity
                            ).toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ${item.unitPrice?.toFixed(2)}/unit
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {(() => {
                            const margin =
                              item.unitPrice && item.costPrice
                                ? ((item.unitPrice - item.costPrice) /
                                    item.unitPrice) *
                                  100
                                : 0;
                            const profit =
                              ((item.unitPrice || 0) -
                                (item.costPrice || 0)) *
                              item.quantity;
                            return (
                              <>
                                <div className="font-medium text-emerald-500">
                                  {margin.toFixed(0)}%
                                </div>
                                <div className="text-xs text-emerald-500/70">
                                  ${profit.toFixed(0)} profit
                                </div>
                              </>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingItemId(item.id);
                            }}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Item Dialog (controlled) */}
      <Dialog open={!!editingItemId} onOpenChange={(open) => !open && setEditingItemId(null)}>
        <DialogContent className="sm:max-w-[500px]">
          {editingItemId && (() => {
            const editItem = inventory.find((i) => i.id === editingItemId);
            if (!editItem) return null;
            return (
              <>
                <DialogHeader>
                  <DialogTitle>Edit {editItem.name}</DialogTitle>
                  <DialogDescription>
                    Update item details, pricing, or stock levels
                  </DialogDescription>
                </DialogHeader>
                <EditItemForm
                  key={editItem.id}
                  item={editItem}
                  saving={isSaving}
                  onSave={(data) => handleUpdateItem(editItem.id, data)}
                  onDelete={() => handleDeleteItem(editItem.id)}
                />
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditItemForm({
  item,
  saving,
  onSave,
  onDelete,
}: {
  item: InventoryItem;
  saving?: boolean;
  onSave: (data: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity.toString());
  const [minStock, setMinStock] = useState(item.minStock.toString());
  const [costPrice, setCostPrice] = useState(item.costPrice?.toString() || "");
  const [unitPrice, setUnitPrice] = useState(item.unitPrice?.toString() || "");
  const [supplier, setSupplier] = useState(item.supplier || "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label>Product Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Units in Stock</Label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Low Stock Alert</Label>
            <Input
              type="number"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Your Cost ($)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Patient Price ($)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Supplier</Label>
          <Input
            placeholder="e.g. Peptide Sciences"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter className="flex !justify-between">
        <div>
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-destructive">Are you sure?</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={onDelete}
              >
                Yes, Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Item
            </Button>
          )}
        </div>
        <Button
          disabled={saving}
          onClick={() =>
            onSave({
              name: name.trim(),
              quantity: parseInt(quantity),
              minStock: parseInt(minStock),
              costPrice: costPrice ? parseFloat(costPrice) : null,
              unitPrice: unitPrice ? parseFloat(unitPrice) : null,
              supplier: supplier.trim() || null,
            })
          }
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </DialogFooter>
    </>
  );
}
