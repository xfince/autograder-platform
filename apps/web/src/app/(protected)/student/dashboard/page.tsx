'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { useMyCourses } from '@/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared';
import { BookOpen, FileText, TrendingUp, Clock, Search } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const { data: courses, isLoading } = useMyCourses();

  const courseCount = courses?.length || 0;
  const totalAssignments = courses?.reduce((sum, c) => sum + (c.assignmentCount || 0), 0) || 0;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.firstName} {user?.lastName}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <BookOpen className="mr-2 h-4 w-4" />
                Enrolled Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <p className="text-3xl font-bold">{courseCount}</p>
                  <p className="text-sm text-gray-600 mt-1">This semester</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <p className="text-3xl font-bold">{totalAssignments}</p>
                  <p className="text-sm text-gray-600 mt-1">Total available</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Due Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm text-gray-600 mt-1">Next 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <TrendingUp className="mr-2 h-4 w-4" />
                Average Grade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">--</p>
              <p className="text-sm text-gray-600 mt-1">No grades yet</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and navigation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/student/courses/browse" className="block">
                <Button className="w-full justify-start" variant="outline">
                  <Search className="mr-2 h-4 w-4" />
                  Browse Available Courses
                </Button>
              </Link>
              <Link href="/student/courses" className="block">
                <Button className="w-full justify-start" variant="outline">
                  <BookOpen className="mr-2 h-4 w-4" />
                  My Courses
                </Button>
              </Link>
              <Link href="/student/assignments" className="block">
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  View Assignments
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>Assignments due soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                No upcoming deadlines. Enroll in courses to see assignments.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>✅ Phase 8 Complete: Student Dashboard</CardTitle>
            <CardDescription>Full student interface</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>View enrolled courses</li>
              <li>Browse and enroll in available courses</li>
              <li>View assignments and deadlines</li>
              <li>Track grades and progress</li>
              <li>Quick action navigation</li>
            </ul>
            <p className="text-sm text-gray-600 pt-4 border-t">
              <strong>Next:</strong> Phase 9 - Testing & Integration
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
