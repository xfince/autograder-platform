'use client';

import { useMyCourses } from '@/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingCard, EmptyState } from '@/components/shared';
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function StudentAssignmentsPage() {
  const { data: courses, isLoading } = useMyCourses();

  if (isLoading) return <LoadingCard />;

  const totalAssignments = courses?.reduce((sum, c) => sum + (c.assignmentCount || 0), 0) || 0;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600 mt-1">Track and submit your assignments</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalAssignments}</p>
              <p className="text-xs text-gray-600 mt-1">All assignments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-gray-600 mt-1">To complete</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <CheckCircle className="mr-1 h-4 w-4" />
                Submitted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-gray-600 mt-1">Completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <AlertCircle className="mr-1 h-4 w-4" />
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">0</p>
              <p className="text-xs text-gray-600 mt-1">Past deadline</p>
            </CardContent>
          </Card>
        </div>

        {!courses?.length ? (
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon="inbox"
                title="No courses enrolled"
                description="Enroll in courses to see and complete assignments."
                action={{
                  label: 'Browse Courses',
                  onClick: () => (window.location.href = '/student/courses/browse'),
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All Assignments</CardTitle>
              <CardDescription>Organized by course</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon="file"
                title="No assignments available"
                description="Your professors haven't created any assignments yet. Check back later."
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
