'use client';

import { useState } from 'react';
import { useCourses, useEnrollCourse } from '@/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingCard, ErrorCard } from '@/components/shared';
import { BookOpen, Users, FileText, CheckCircle, Search, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function BrowseCoursesPage() {
  const { data: courses, isLoading, error, refetch } = useCourses();
  const enrollMutation = useEnrollCourse();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCourses = courses?.filter(
    (course) =>
      course.isActive &&
      (course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.name.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const handleEnroll = async (courseId: string) => {
    try {
      await enrollMutation.mutateAsync(courseId);
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (isLoading) return <LoadingCard />;
  if (error) return <ErrorCard message="Failed to load courses" onRetry={refetch} />;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <Link href="/student/courses">
            <Button variant="ghost" size="sm" className="mb-4">
              ← Back to My Courses
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Browse Courses</h1>
          <p className="text-gray-600 mt-1">Find and enroll in available courses</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="mr-2 h-5 w-5" />
              Search Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by course code or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses?.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{course.code}</CardTitle>
                    <CardDescription className="mt-1">{course.name}</CardDescription>
                  </div>
                  <div className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {course.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                )}

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
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    {course.studentCount || 0} students
                  </div>
                </div>

                <Button
                  onClick={() => handleEnroll(course.id)}
                  disabled={enrollMutation.isPending}
                  className="w-full"
                  size="sm"
                >
                  {enrollMutation.isPending ? (
                    'Enrolling...'
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Enroll
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCourses?.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
              <p className="text-sm text-gray-600">
                Try adjusting your search or check back later for new courses.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
