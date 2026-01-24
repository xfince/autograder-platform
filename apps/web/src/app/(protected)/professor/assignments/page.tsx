'use client';

import { useMyCourses } from '@/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingCard, EmptyState } from '@/components/shared';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function ProfessorAssignmentsPage() {
  const { data: courses, isLoading } = useMyCourses();

  if (isLoading) return <LoadingCard />;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
            <p className="text-gray-600 mt-1">Manage assignments across all courses</p>
          </div>
          <Link href="/professor/assignments/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Assignment
            </Button>
          </Link>
        </div>

        {!courses?.length ? (
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon="inbox"
                title="No courses available"
                description="Create a course first before creating assignments."
                action={{
                  label: 'Create Course',
                  onClick: () => (window.location.href = '/professor/courses/new'),
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">0</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Published</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">0</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Draft</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">0</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">0</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Assignments</CardTitle>
                <CardDescription>Coming soon - assignment list with filters</CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon="file"
                  title="No assignments yet"
                  description="Create your first assignment to get started."
                  action={{
                    label: 'Create Assignment',
                    onClick: () => (window.location.href = '/professor/assignments/new'),
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
