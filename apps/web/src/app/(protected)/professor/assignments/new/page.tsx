'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCreateAssignment, useMyCourses } from '@/hooks';
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
import Link from 'next/link';

export default function NewAssignmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseIdParam = searchParams.get('courseId');

  const { data: courses, isLoading: coursesLoading } = useMyCourses();
  const { mutate: createAssignment, isPending } = useCreateAssignment();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: courseIdParam || '',
    rubricId: '',
    dueDate: '',
    maxSubmissions: 5,
    allowLateSubmissions: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Set courseId from URL param
  useEffect(() => {
    if (courseIdParam) {
      setFormData((prev) => ({ ...prev, courseId: courseIdParam }));
    }
  }, [courseIdParam]);

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

    createAssignment(
      {
        title: formData.title,
        description: formData.description,
        courseId: formData.courseId,
        rubricId: formData.rubricId,
        dueDate: new Date(formData.dueDate).toISOString(),
        maxSubmissions: formData.maxSubmissions,
        allowLateSubmissions: formData.allowLateSubmissions,
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

  const selectedCourse = courses?.find((c) => c.id === formData.courseId);

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href={
              formData.courseId
                ? `/professor/courses/${formData.courseId}`
                : '/professor/assignments'
            }
          >
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Assignment</h1>
            <p className="text-gray-600 mt-1">Add a new assignment for your course</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Assignment Details</CardTitle>
              <CardDescription>Fill in the information for your new assignment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Course Selection */}
              <div className="space-y-2">
                <Label htmlFor="course">
                  Course <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.courseId}
                  onValueChange={(value) => handleChange('courseId', value)}
                  disabled={!!courseIdParam || coursesLoading}
                >
                  <SelectTrigger id="course" className={errors.courseId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses?.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.courseId && <p className="text-sm text-red-500">{errors.courseId}</p>}
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
                        {formData.courseId
                          ? 'No rubrics available. Create one first.'
                          : 'Select a course first'}
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {errors.rubricId && <p className="text-sm text-red-500">{errors.rubricId}</p>}
                {formData.courseId &&
                  (!selectedCourse?.rubrics || selectedCourse.rubrics.length === 0) && (
                    <p className="text-sm text-gray-500">
                      <Link
                        href={`/professor/courses/${formData.courseId}`}
                        className="text-blue-600 hover:underline"
                      >
                        Create a rubric
                      </Link>{' '}
                      for this course first
                    </p>
                  )}
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
                <p className="text-sm text-gray-500">
                  Students can submit up to this many times (default: 5)
                </p>
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
            <Link
              href={
                formData.courseId
                  ? `/professor/courses/${formData.courseId}`
                  : '/professor/assignments'
              }
            >
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isPending}>
              <Save className="mr-2 h-4 w-4" />
              {isPending ? 'Creating...' : 'Create Assignment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
