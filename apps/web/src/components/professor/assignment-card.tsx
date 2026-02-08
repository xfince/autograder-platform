import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, Calendar, Edit, Eye, Trash2 } from 'lucide-react';
import { Assignment } from '@/services/assignments.service';
import { format, isPast } from 'date-fns';

interface ProfessorAssignmentCardProps {
  assignment: Assignment;
  onPublishToggle?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ProfessorAssignmentCard({
  assignment,
  onPublishToggle,
  onDelete,
}: ProfessorAssignmentCardProps) {
  const dueDate = new Date(assignment.dueDate);
  const isOverdue = isPast(dueDate);
  const isPublished = assignment.isPublished;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {assignment.title}
            </CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Due {format(dueDate, 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{format(dueDate, 'HH:mm')}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isPublished && <Badge variant="secondary">Draft</Badge>}
            {isPublished && isOverdue && <Badge variant="destructive">Overdue</Badge>}
            {isPublished && !isOverdue && <Badge variant="default">Published</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {assignment.description && (
          <p className="text-gray-700 text-sm line-clamp-2">{assignment.description}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {assignment.rubric && (
              <span className="font-medium">{assignment.rubric.totalPoints} points</span>
            )}
            {assignment.maxSubmissions > 0 && (
              <span>Max: {assignment.maxSubmissions} attempts</span>
            )}
            {assignment.submissionCount !== undefined && (
              <span>{assignment.submissionCount} submissions</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onPublishToggle && (
              <Button
                size="sm"
                variant={isPublished ? 'outline' : 'default'}
                onClick={() => onPublishToggle(assignment.id)}
              >
                {isPublished ? (
                  <>
                    <Eye className="mr-1 h-3 w-3" />
                    Published
                  </>
                ) : (
                  'Publish'
                )}
              </Button>
            )}
            <Link href={`/professor/assignments/${assignment.id}/edit`}>
              <Button size="sm" variant="ghost">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(assignment.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
