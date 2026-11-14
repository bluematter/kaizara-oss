"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  User,
  Filter,
  ListTodo,
  ArrowUpCircle,
  ArrowRightCircle,
  ArrowDownCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import Link from "next/link";

type TaskStatusType = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type TaskPriorityType = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface TaskData {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: TaskPriorityType;
  status: TaskStatusType;
  patientId: string | null;
  patientName: string | null;
  assignedTo: { id: string; name: string } | null;
  createdAt: string;
  completedAt: string | null;
}

interface PatientOption {
  id: string;
  firstName: string;
  lastName: string;
}

const priorityConfig: Record<TaskPriorityType, { label: string; color: string; icon: typeof ArrowUpCircle }> = {
  URGENT: { label: "Urgent", color: "text-red-500 bg-red-500/10", icon: AlertCircle },
  HIGH: { label: "High", color: "text-orange-500 bg-orange-500/10", icon: ArrowUpCircle },
  MEDIUM: { label: "Medium", color: "text-yellow-500 bg-yellow-500/10", icon: ArrowRightCircle },
  LOW: { label: "Low", color: "text-blue-500 bg-blue-500/10", icon: ArrowDownCircle },
};

const columnConfig: Record<TaskStatusType, { label: string; icon: typeof Circle; iconColor: string }> = {
  PENDING: { label: "Pending", icon: Circle, iconColor: "text-muted-foreground" },
  IN_PROGRESS: { label: "In Progress", icon: Loader2, iconColor: "text-primary" },
  COMPLETED: { label: "Completed", icon: CheckCircle2, iconColor: "text-emerald-500" },
  CANCELLED: { label: "Cancelled", icon: Circle, iconColor: "text-muted-foreground" },
};

function getDueDateDisplay(dueDate: string | null) {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  if (isPast(d) && !isToday(d)) {
    return { label: "Overdue", color: "text-red-500 bg-red-500/10" };
  }
  if (isToday(d)) {
    return { label: "Today", color: "text-orange-500 bg-orange-500/10" };
  }
  if (isTomorrow(d)) {
    return { label: "Tomorrow", color: "text-yellow-500 bg-yellow-500/10" };
  }
  return { label: format(d, "MMM d"), color: "text-muted-foreground bg-muted" };
}

function DroppableColumn({
  id,
  tasks,
  children,
}: {
  id: TaskStatusType;
  tasks: TaskData[];
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });
  const config = columnConfig[id];
  const Icon = config.icon;

  return (
    <Card className={`transition-all ${isOver ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className={`h-4 w-4 ${config.iconColor} ${id === "IN_PROGRESS" ? "animate-spin" : ""}`} />
          {config.label}
          <Badge variant="secondary" className="ml-auto">{tasks.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent
        ref={setNodeRef}
        className={`space-y-3 min-h-[200px] transition-colors ${isOver ? "bg-primary/5" : ""}`}
      >
        {children}
      </CardContent>
    </Card>
  );
}

function TaskCardContent({ task, isOverlay = false }: { task: TaskData; isOverlay?: boolean }) {
  const priority = priorityConfig[task.priority];
  const dueDisplay = getDueDateDisplay(task.dueDate);
  const PriorityIcon = priority.icon;

  return (
    <div className="flex-1 min-w-0">
      <p className={`font-medium text-sm ${task.status === "COMPLETED" ? "line-through text-muted-foreground" : ""}`}>
        {task.title}
      </p>
      {task.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
      )}
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <Badge variant="outline" className={`text-xs ${priority.color}`}>
          <PriorityIcon className="h-3 w-3 mr-1" />
          {priority.label}
        </Badge>
        {dueDisplay && (
          <Badge variant="outline" className={`text-xs ${dueDisplay.color}`}>
            <Calendar className="h-3 w-3 mr-1" />
            {dueDisplay.label}
          </Badge>
        )}
        {task.patientName && !isOverlay && (
          <Link href={`/patients/${task.patientId}`} onClick={(e) => e.stopPropagation()}>
            <Badge variant="outline" className="text-xs hover:bg-muted cursor-pointer">
              <User className="h-3 w-3 mr-1" />
              {task.patientName}
            </Badge>
          </Link>
        )}
        {task.patientName && isOverlay && (
          <Badge variant="outline" className="text-xs">
            <User className="h-3 w-3 mr-1" />
            {task.patientName}
          </Badge>
        )}
      </div>
    </div>
  );
}

function SortableTaskCard({ task, onEdit }: { task: TaskData; onEdit: (task: TaskData) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = () => {
    if (!transform) onEdit(task);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`rounded-lg border bg-card p-3 cursor-grab active:cursor-grabbing touch-none transition-shadow ${
        isDragging ? "opacity-50 shadow-lg ring-2 ring-primary" : "hover:shadow-md hover:border-primary/50"
      } ${task.status === "COMPLETED" ? "opacity-60" : ""}`}
    >
      <TaskCardContent task={task} />
    </div>
  );
}

function TaskCardOverlay({ task }: { task: TaskData }) {
  return (
    <div className="rounded-lg border bg-card p-3 shadow-2xl rotate-2 cursor-grabbing">
      <TaskCardContent task={task} isOverlay />
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<TaskData | null>(null);
  const [editingTask, setEditingTask] = useState<TaskData | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // New task form
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriorityType>("MEDIUM");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPatientId, setNewPatientId] = useState("none");

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<TaskPriorityType>("MEDIUM");
  const [editDueDate, setEditDueDate] = useState("");
  const [editPatientId, setEditPatientId] = useState<string>("none");
  const [editStatus, setEditStatus] = useState<TaskStatusType>("PENDING");

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks?limit=200");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch {
      // Failed
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetch("/api/patients?limit=100").then(r => r.ok ? r.json() : null).then(d => {
      if (d?.patients) setPatients(d.patients);
    }).catch(() => {});
  }, [fetchTasks]);

  const openEditDialog = (task: TaskData) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "");
    setEditPatientId(task.patientId || "none");
    setEditStatus(task.status);
    setEditDialogOpen(true);
  };

  const handleCreateTask = async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription || null,
          priority: newPriority,
          dueDate: newDueDate || null,
          patientId: newPatientId === "none" ? null : newPatientId,
        }),
      });
      if (res.ok) {
        setAddTaskDialogOpen(false);
        setNewTitle("");
        setNewDescription("");
        setNewPriority("MEDIUM");
        setNewDueDate("");
        setNewPatientId("none");
        fetchTasks();
      }
    } catch {
      // Failed
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTask) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTask.id,
          title: editTitle,
          description: editDescription || null,
          priority: editPriority,
          dueDate: editDueDate || null,
          status: editStatus,
          patientId: editPatientId === "none" ? null : editPatientId,
        }),
      });
      if (res.ok) {
        setEditDialogOpen(false);
        setEditingTask(null);
        fetchTasks();
      }
    } catch {
      // Failed
    }
  };

  const handleDeleteTask = async () => {
    if (!editingTask) return;
    try {
      const res = await fetch(`/api/tasks?id=${editingTask.id}`, { method: "DELETE" });
      if (res.ok) {
        setEditDialogOpen(false);
        setEditingTask(null);
        fetchTasks();
      }
    } catch {
      // Failed
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatusType) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: newStatus, completedAt: newStatus === "COMPLETED" ? new Date().toISOString() : null }
          : t
      )
    );
    // Persist
    fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, status: newStatus }),
    }).catch(() => fetchTasks()); // Revert on failure
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.patientName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const pendingTasks = filteredTasks.filter((t) => t.status === "PENDING");
  const inProgressTasks = filteredTasks.filter((t) => t.status === "IN_PROGRESS");
  const completedTasks = filteredTasks.filter((t) => t.status === "COMPLETED");

  const urgentCount = tasks.filter((t) => t.priority === "URGENT" && t.status !== "COMPLETED").length;
  const dueTodayCount = tasks.filter((t) => t.dueDate && isToday(new Date(t.dueDate)) && t.status !== "COMPLETED").length;
  const overdueCount = tasks.filter((t) => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && t.status !== "COMPLETED").length;

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const columns: TaskStatusType[] = ["PENDING", "IN_PROGRESS", "COMPLETED"];

    if (columns.includes(overId as TaskStatusType)) {
      updateTaskStatus(activeId, overId as TaskStatusType);
      return;
    }

    const overTask = tasks.find((t) => t.id === overId);
    if (overTask) {
      const activeTaskData = tasks.find((t) => t.id === activeId);
      if (activeTaskData && activeTaskData.status !== overTask.status) {
        updateTaskStatus(activeId, overTask.status);
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const columns: TaskStatusType[] = ["PENDING", "IN_PROGRESS", "COMPLETED"];

    if (columns.includes(overId as TaskStatusType)) {
      const activeTaskData = tasks.find((t) => t.id === activeId);
      if (activeTaskData && activeTaskData.status !== overId) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === activeId ? { ...t, status: overId as TaskStatusType } : t
          )
        );
      }
      return;
    }

    const overTask = tasks.find((t) => t.id === overId);
    const activeTaskData = tasks.find((t) => t.id === activeId);
    if (activeTaskData && overTask && activeTaskData.status !== overTask.status) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: overTask.status } : t
        )
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
          <p className="text-muted-foreground">
            Manage your to-do list and follow-ups
          </p>
        </div>
        <Dialog open={addTaskDialogOpen} onOpenChange={setAddTaskDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>Add a task to your to-do list</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  placeholder="Review lab results for..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add any details or notes..."
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={newPriority} onValueChange={(v) => setNewPriority(v as TaskPriorityType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Link to Patient (optional)</Label>
                <Select value={newPatientId} onValueChange={setNewPatientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Patient</SelectItem>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.firstName} {p.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddTaskDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateTask}>Create Task</Button>
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
                <ListTodo className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{tasks.filter((t) => t.status !== "COMPLETED").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${urgentCount > 0 ? "bg-red-500/10" : "bg-muted"}`}>
                <AlertCircle className={`h-6 w-6 ${urgentCount > 0 ? "text-red-500" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Urgent</p>
                <p className="text-2xl font-bold">{urgentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${dueTodayCount > 0 ? "bg-orange-500/10" : "bg-muted"}`}>
                <Calendar className={`h-6 w-6 ${dueTodayCount > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Due Today</p>
                <p className="text-2xl font-bold">{dueTodayCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${overdueCount > 0 ? "bg-red-500/10" : "bg-emerald-500/10"}`}>
                <Clock className={`h-6 w-6 ${overdueCount > 0 ? "text-red-500" : "text-emerald-500"}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">{overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Click to edit tasks. Drag between columns to change status.
      </p>

      {/* Edit Task Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Task Title</Label>
              <Input id="edit-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea id="edit-description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={editPriority} onValueChange={(v) => setEditPriority(v as TaskPriorityType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as TaskStatusType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Link to Patient</Label>
                <Select value={editPatientId} onValueChange={setEditPatientId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Patient</SelectItem>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.firstName} {p.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="destructive" onClick={handleDeleteTask} className="mr-auto">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <DroppableColumn id="PENDING" tasks={pendingTasks}>
            <SortableContext items={pendingTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {pendingTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No pending tasks</p>
              ) : (
                pendingTasks.map((task) => <SortableTaskCard key={task.id} task={task} onEdit={openEditDialog} />)
              )}
            </SortableContext>
          </DroppableColumn>

          <DroppableColumn id="IN_PROGRESS" tasks={inProgressTasks}>
            <SortableContext items={inProgressTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {inProgressTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No tasks in progress</p>
              ) : (
                inProgressTasks.map((task) => <SortableTaskCard key={task.id} task={task} onEdit={openEditDialog} />)
              )}
            </SortableContext>
          </DroppableColumn>

          <DroppableColumn id="COMPLETED" tasks={completedTasks}>
            <SortableContext items={completedTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {completedTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No completed tasks</p>
              ) : (
                completedTasks.map((task) => <SortableTaskCard key={task.id} task={task} onEdit={openEditDialog} />)
              )}
            </SortableContext>
          </DroppableColumn>
        </div>

        <DragOverlay>
          {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
