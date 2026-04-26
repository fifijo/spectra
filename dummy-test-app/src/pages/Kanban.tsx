import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, MoreHorizontal, GripVertical, Trash2, Edit2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Task {
  id: string
  title: string
  description?: string
  priority: "low" | "medium" | "high"
}

interface Column {
  id: string
  title: string
  color: string
  tasks: Task[]
}

const COLUMNS: Column[] = [
  { id: "backlog", title: "Backlog", color: "bg-gray-500", tasks: [
    { id: "1", title: "User authentication flow", priority: "high" },
    { id: "2", title: "API rate limiting", priority: "medium" },
    { id: "3", title: "Database indexing", priority: "low" },
  ]},
  { id: "todo", title: "To Do", color: "bg-blue-500", tasks: [
    { id: "4", title: "Design new dashboard", priority: "high" },
    { id: "5", title: "Implement search filters", priority: "medium" },
  ]},
  { id: "inprogress", title: "In Progress", color: "bg-yellow-500", tasks: [
    { id: "6", title: "Fix login bug", priority: "high", description: "Users unable to login with special chars" },
  ]},
  { id: "done", title: "Done", color: "bg-green-500", tasks: [
    { id: "7", title: "Setup CI/CD pipeline", priority: "medium" },
    { id: "8", title: "Update documentation", priority: "low" },
  ]},
]

const PRIORITY_COLORS = {
  low: "secondary",
  medium: "warning",
  high: "destructive",
} as const

export function Kanban() {
  const [columns, setColumns] = useState<Column[]>(COLUMNS)
  const [draggedTask, setDraggedTask] = useState<{ task: Task; sourceColId: string } | null>(null)
  const [dragOverColId, setDragOverColId] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, task: Task, colId: string) => {
    setDraggedTask({ task, sourceColId: colId })
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault()
    setDragOverColId(colId)
  }

  const handleDragLeave = () => {
    setDragOverColId(null)
  }

  const handleDrop = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault()
    if (!draggedTask) return

    if (draggedTask.sourceColId !== targetColId) {
      setColumns(cols => cols.map(col => {
        if (col.id === draggedTask.sourceColId) {
          return { ...col, tasks: col.tasks.filter(t => t.id !== draggedTask.task.id) }
        }
        if (col.id === targetColId) {
          return { ...col, tasks: [...col.tasks, draggedTask.task] }
        }
        return col
      }))
    }

    setDraggedTask(null)
    setDragOverColId(null)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
    setDragOverColId(null)
  }

  const addTask = (colId: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: "New Task",
      priority: "medium",
    }
    setColumns(cols => cols.map(col =>
      col.id === colId ? { ...col, tasks: [...col.tasks, newTask] } : col
    ))
  }

  const deleteTask = (colId: string, taskId: string) => {
    setColumns(cols => cols.map(col =>
      col.id === colId ? { ...col, tasks: col.tasks.filter(t => t.id !== taskId) } : col
    ))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kanban Board</h1>
        <p className="text-muted-foreground">Drag and drop tasks to update status</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4" data-testid="kanban-board">
        {columns.map((column) => (
          <div
            key={column.id}
            className={`flex-shrink-0 w-72 rounded-lg border-2 border-dashed p-2 transition-colors ${
              dragOverColId === column.id ? "border-primary bg-primary/5" : "border-transparent"
            }`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
            data-testid={`column-${column.id}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${column.color}`} />
                <h3 className="font-semibold">{column.title}</h3>
                <Badge variant="outline" className="ml-1">{column.tasks.length}</Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => addTask(column.id)}
                data-testid={`add-task-${column.id}`}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 min-h-[200px]">
              {column.tasks.map((task) => (
                <Card
                  key={task.id}
                  className={`cursor-grab ${draggedTask?.task.id === task.id ? "opacity-50" : ""}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task, column.id)}
                  onDragEnd={handleDragEnd}
                  data-testid={`task-card-${task.id}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">{task.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant={PRIORITY_COLORS[task.priority]} className="text-xs">
                            {task.priority}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem data-testid={`edit-task-${task.id}`}>
                                <Edit2 className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => deleteTask(column.id, task.id)}
                                data-testid={`delete-task-${task.id}`}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}