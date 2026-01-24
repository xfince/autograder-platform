'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LoadingSpinner,
  LoadingCard,
  ErrorMessage,
  ErrorCard,
  EmptyState,
  EmptyCard,
} from '@/components/shared';

export default function ComponentsDemo() {

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shared Components Demo</h1>
          <p className="text-gray-600 mt-1">Phase 6 completed - All reusable components</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Loading Spinners */}
          <Card>
            <CardHeader>
              <CardTitle>Loading Spinners</CardTitle>
              <CardDescription>Different sizes and variations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm font-medium mb-2">Small</p>
                <LoadingSpinner size="sm" />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Medium with text</p>
                <LoadingSpinner size="md" text="Loading data..." />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Large</p>
                <LoadingSpinner size="lg" />
              </div>
            </CardContent>
          </Card>

          {/* Error Messages */}
          <Card>
            <CardHeader>
              <CardTitle>Error Messages</CardTitle>
              <CardDescription>With and without retry</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ErrorMessage message="Failed to load data" />
              <ErrorMessage
                title="Network Error"
                message="Failed to connect to server"
                onRetry={() => alert('Retrying...')}
              />
            </CardContent>
          </Card>

          {/* Loading Card */}
          <Card>
            <CardHeader>
              <CardTitle>Loading Card</CardTitle>
              <CardDescription>Full card loading state</CardDescription>
            </CardHeader>
            <CardContent>
              <LoadingCard />
            </CardContent>
          </Card>

          {/* Error Card */}
          <Card>
            <CardHeader>
              <CardTitle>Error Card</CardTitle>
              <CardDescription>Full card error state</CardDescription>
            </CardHeader>
            <CardContent>
              <ErrorCard
                message="Failed to load assignments"
                onRetry={() => alert('Retrying...')}
              />
            </CardContent>
          </Card>

          {/* Empty State */}
          <Card>
            <CardHeader>
              <CardTitle>Empty State - Inbox</CardTitle>
              <CardDescription>No data available</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon="inbox"
                title="No courses yet"
                description="Get started by creating your first course or enrolling in an existing one."
                action={{
                  label: 'Create Course',
                  onClick: () => alert('Create course clicked'),
                }}
              />
            </CardContent>
          </Card>

          {/* Empty Card */}
          <Card>
            <CardHeader>
              <CardTitle>Empty Card</CardTitle>
              <CardDescription>Simple empty state</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyCard
                title="No submissions"
                description="There are no submissions for this assignment yet."
              />
            </CardContent>
          </Card>
        </div>

        {/* Component Usage Info */}
        <Card>
          <CardHeader>
            <CardTitle>✅ Phase 6 Complete: Shared Components</CardTitle>
            <CardDescription>All reusable UI components ready</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Available Components:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Navbar with user dropdown menu</li>
                <li>Loading spinners (sm, md, lg)</li>
                <li>Error messages with retry</li>
                <li>Empty states (inbox, file icons)</li>
                <li>Card variations for all states</li>
              </ul>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">
                <strong>Next Phase:</strong> Phase 7 - Professor Dashboard implementation
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
