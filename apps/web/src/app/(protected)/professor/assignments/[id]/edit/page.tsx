'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAssignment, useUpdateAssignment, useMyCourses } from '@/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { LoadingCard } from '@/components/shared';
import Link from 'next/link';
import { format } from 'date-fns';

export default function EditAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;

  const { data: assignment, isLoading: assignmentLoading } = useAssignment(assignmentId);
  const { data: courses, isLoading: coursesLoading } = useMyCourses();
  const { mutate: updateAssignment, isPending } = useUpdateAssignment();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    rubricId: '',
    dueDate: '',
    maxSubmissions: 5,
    allowLateSubmissions: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load assignment data into form
  useEffect(() => {
    if (assignment) {
      // Format the date for datetime-local input
      const dueDateObj = new Date(assignment.dueDate);
      const formattedDate = format(dueDateObj, "yyyy-MM-dd'T'HH:mm");

      setFormData({
        title: assignment.title,
        description: assignment.description || '',
        courseId: assignment.course?.id || '',
        rubricId: assignment.rubric?.id || '',
        dueDate: formattedDate,
        maxSubmissions: assignment.maxSubmissions,
        allowLateSubmissions: assignment.allowLateSubmissions,
      });
    }
  }, [assignment]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.courseId) {
      newErrors.courseId = 'Course is required';
    }

    if (!formData.rubricId) {
      newErrors.rubricId = 'Rubric is required';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else {
      const dueDate = new Date(formData.dueDate);
      if (dueDate <= new Date()) {
        newErrors.dueDate = 'Due date must be in the future';
      }
    }

    if (formData.maxSubmissions < 1) {
      newErrors.maxSubmissions = 'Max submissions must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    updateAssignment(
      {
        id: assignmentId,
        data: {
          title: formData.title,
          description: formData.description,
          courseId: formData.courseId,
          rubricId: formData.rubricId,
          dueDate: new Date(formData.dueDate).toISOString(),
          maxSubmissions: formData.maxSubmissions,
          allowLateSubmissions: formData.allowLateSubmissions,
        },
      },
      {
        onSuccess: (data) => {
          router.push(`/professor/courses/${data.course?.id}`);
        },
      },
    );
  };

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (assignmentLoading || coursesLoading) {
    return <LoadingCard />;
  }

  if (!assignment) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-600">Assignment not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const selectedCourse = courses?.find((c) => c.id === formData.courseId);

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/professor/courses/${assignment.course?.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Assignment</h1>
            <p className="text-gray-600 mt-1">Update assignment details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Assignment Details</CardTitle>
              <CardDescription>Modify the information for this assignment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Course Selection (Disabled) */}
              <div className="space-y-2">
                <Label htmlFor="course">
                  Course <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.courseId} disabled>
                  <SelectTrigger id="course">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {courses?.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">Course cannot be changed after creation</p>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Homework 1 - Data Structures"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed instructions for the assignment..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={6}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
              </div>

              {/* Rubric Selection */}
              <div className="space-y-2">
                <Label htmlFor="rubric">
                  Rubric <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.rubricId}
                  onValueChange={(value) => handleChange('rubricId', value)}
                >
                  <SelectTrigger id="rubric" className={errors.rubricId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select a rubric" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCourse?.rubrics?.map(
                      (rubric: { id: string; name: string; totalPoints: number }) => (
                        <SelectItem key={rubric.id} value={rubric.id}>
                          {rubric.name} ({rubric.totalPoints} points)
                        </SelectItem>
                      ),
                    )}
                    {(!selectedCourse?.rubrics || selectedCourse.rubrics.length === 0) && (
                      <div className="px-2 py-1.5 text-sm text-gray-500">
                        No rubrics available. Create one first.
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {errors.rubricId && <p className="text-sm text-red-500">{errors.rubricId}</p>}
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label htmlFor="dueDate">
                  Due Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => handleChange('dueDate', e.target.value)}
                  className={errors.dueDate ? 'border-red-500' : ''}
                />
                {errors.dueDate && <p className="text-sm text-red-500">{errors.dueDate}</p>}
              </div>

              {/* Max Submissions */}
              <div className="space-y-2">
                <Label htmlFor="maxSubmissions">
                  Maximum Submissions <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="maxSubmissions"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.maxSubmissions}
                  onChange={(e) => handleChange('maxSubmissions', parseInt(e.target.value) || 1)}
                  className={errors.maxSubmissions ? 'border-red-500' : ''}
                />
                {errors.maxSubmissions && (
                  <p className="text-sm text-red-500">{errors.maxSubmissions}</p>
                )}
                <p className="text-sm text-gray-500">Students can submit up to this many times</p>
              </div>

              {/* Allow Late Submissions */}
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="allowLate">Allow Late Submissions</Label>
                  <p className="text-sm text-gray-500">Students can submit after the due date</p>
                </div>
                <Switch
                  id="allowLate"
                  checked={formData.allowLateSubmissions}
                  onCheckedChange={(checked: boolean) =>
                    handleChange('allowLateSubmissions', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-6">
            <Link href={`/professor/courses/${assignment.course?.id}`}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isPending}>
              <Save className="mr-2 h-4 w-4" />
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
