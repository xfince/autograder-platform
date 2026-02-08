import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, Calendar } from 'lucide-react';
import { Assignment } from '@/services/assignments.service';
import { format, isPast } from 'date-fns';

interface AssignmentCardProps {
  assignment: Assignment;
  courseId: string;
}

export function AssignmentCard({ assignment, courseId }: AssignmentCardProps) {
  const dueDate = new Date(assignment.dueDate);
  const isOverdue = isPast(dueDate);
  const isPublished = assignment.isPublished;

  return (
    <Card className={!isPublished ? 'opacity-60' : ''}>
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
            {isPublished && !isOverdue && <Badge variant="default">Open</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {assignment.description && (
          <p className="text-gray-700 text-sm">{assignment.description}</p>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {assignment.rubric && <span>Points: {assignment.rubric.totalPoints}</span>}
            {assignment.maxSubmissions > 0 && (
              <span>Max Attempts: {assignment.maxSubmissions}</span>
            )}
          </div>

          {isPublished && (
            <Link href={`/student/courses/${courseId}/assignments/${assignment.id}`}>
              <Button size="sm">View Details</Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
