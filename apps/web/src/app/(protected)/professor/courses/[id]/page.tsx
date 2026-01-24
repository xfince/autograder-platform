'use client';

import { use } from 'react';
import Link from 'next/link';
import { useCourse } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingPage, ErrorPage, EmptyState } from '@/components/shared';
import { ArrowLeft, Edit, Users, FileText, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: course, isLoading, error, refetch } = useCourse(id);

  if (isLoading) return <LoadingPage text="Loading course..." />;
  if (error) return <ErrorPage message="Failed to load course" onRetry={refetch} />;
  if (!course) return <ErrorPage message="Course not found" />;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/professor/courses">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {course.code} - {course.name}
              </h1>
              <p className="text-gray-600 mt-1">
                {course.semester} {course.year}
              </p>
            </div>
          </div>
          <Link href={`/professor/courses/${id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Course
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{course.studentCount || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Enrolled students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{course.assignmentCount || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Total assignments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  course.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {course.isActive ? 'Active' : 'Inactive'}
              </div>
              <p className="text-sm text-gray-600 mt-2">Course status</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Course Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{course.description || 'No description provided'}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Assignments</CardTitle>
                  <Link href={`/professor/assignments/new?courseId=${id}`}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Assignment
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon="file"
                  title="No assignments yet"
                  description="Create your first assignment for this course."
                  action={{
                    label: 'Create Assignment',
                    onClick: () =>
                      (window.location.href = `/professor/assignments/new?courseId=${id}`),
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Enrolled Students</CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon="inbox"
                  title="No students enrolled"
                  description="Students can enroll in this course from their dashboard."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
