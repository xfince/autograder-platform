import { useState } from 'react';
import { Task } from '@/lib/types';
import { format } from 'date-fns';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

interface TaskCardProps {
  task: Task;
  onUpdate: () => void;
}

export default function TaskCard({ task, onUpdate }: TaskCardProps) {
  const [updating, setUpdating] = useState(false);

  const updateTaskStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      await api.put(`/tasks/${task._id}`, { status: newStatus });
      toast.success('Task updated successfully');
      onUpdate();
    } catch (error) {
      toast.error('Failed to update task');
    } finally {
      setUpdating(false);
    }
  };

  const getPriorityClass = () => {
    switch (task.priority) {
      case 'high':
        return 'badge-high';
      case 'medium':
        return 'badge-medium';
      case 'low':
        return 'badge-low';
      default:
        return 'badge-low';
    }
  };

  const getStatusClass = () => {
    switch (task.status) {
      case 'completed':
        return 'badge-completed';
      case 'in-progress':
        return 'badge-in-progress';
      case 'todo':
        return 'badge-todo';
      default:
        return 'badge-todo';
    }
  };

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
            <span className={`badge ${getPriorityClass()}`}>
              {task.priority.toUpperCase()}
            </span>
            <span className={`badge ${getStatusClass()}`}>
              {task.status.replace('-', ' ').toUpperCase()}
            </span>
          </div>

          {task.description && (
            <p className="text-gray-600 text-sm mb-3">{task.description}</p>
          )}

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            {task.assignedTo && (
              <div className="flex items-center space-x-2">
                <img
                  src={task.assignedTo.avatar || `https://ui-avatars.com/api/?name=${task.assignedTo.name}`}
                  alt={task.assignedTo.name}
                  className="w-6 h-6 rounded-full"
                />
                <span>{task.assignedTo.name}</span>
              </div>
            )}

            {task.dueDate && (
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className={task.isOverdue ? 'text-red-600 font-medium' : ''}>
                  {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                  {task.isOverdue && ' (Overdue)'}
                </span>
              </div>
            )}

            {task.comments && task.comments.length > 0 && (
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <span>{task.comments.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex space-x-2 ml-4">
          {task.status !== 'completed' && (
            <button
              onClick={() => updateTaskStatus(task.status === 'todo' ? 'in-progress' : 'completed')}
              disabled={updating}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {task.status === 'todo' ? 'Start' : 'Complete'}
            </button>
          )}
          {task.status === 'completed' && (
            <button
              onClick={() => updateTaskStatus('todo')}
              disabled={updating}
              className="btn-secondary text-sm"
            >
              Reopen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}