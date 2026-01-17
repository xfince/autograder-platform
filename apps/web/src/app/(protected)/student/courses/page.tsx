'use client';

import Link from 'next/link';
import { useMyCourses } from '@/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingCard, ErrorCard, EmptyState } from '@/components/shared';
import { BookOpen, Users, FileText, ExternalLink, Calendar } from 'lucide-react';

export default function StudentCoursesPage() {
  const { data: courses, isLoading, error, refetch } = useMyCourses();

  if (isLoading) return <LoadingCard />;
  if (error) return <ErrorCard message="Failed to load courses" onRetry={refetch} />;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
            <p className="text-gray-600 mt-1">View your enrolled courses</p>
          </div>
          <Link href="/student/courses/browse">
            <Button>
              <BookOpen className="mr-2 h-4 w-4" />
              Browse Courses
            </Button>
          </Link>
        </div>

        {!courses?.length ? (
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon="inbox"
                title="No courses enrolled"
                description="Browse available courses and enroll to get started with assignments."
                action={{
                  label: 'Browse Courses',
                  onClick: () => (window.location.href = '/student/courses/browse'),
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{course.code}</CardTitle>
                      <CardDescription className="mt-1">{course.name}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-600 space-y-2">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      {course.professor?.firstName} {course.professor?.lastName}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {course.semester} {course.year}
                    </div>
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      {course.assignmentCount || 0} assignments
                    </div>
                  </div>

                  <Link href={`/student/courses/${course.id}`} className="block">
                    <Button variant="outline" className="w-full" size="sm">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Course
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
