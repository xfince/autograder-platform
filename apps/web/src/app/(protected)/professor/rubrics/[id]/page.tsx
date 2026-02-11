'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, FileJson, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { rubricsService, type Rubric, type Criterion } from '@/services';

const EVALUATION_METHOD_COLORS: Record<string, string> = {
  unit_test: '#3b82f6', // blue
  gpt_semantic: '#10b981', // green
  hybrid: '#f59e0b', // amber
  manual: '#6366f1', // indigo
};

const CHART_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

export default function RubricDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { success, error: showError } = useToast();
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const rubricId = params.id as string;

  useEffect(() => {
    if (rubricId) {
      fetchRubric();
    }
  }, [rubricId]);

  const fetchRubric = async () => {
    try {
      setLoading(true);
      const data = await rubricsService.getById(rubricId);
      setRubric(data);
    } catch (err) {
      showError('Error', 'Failed to load rubric details');
      console.error('Error fetching rubric:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!rubric) return;

    try {
      setDeleting(true);
      await rubricsService.delete(rubric.id);
      success('Success', `Rubric "${rubric.name}" has been deleted`);
      router.push('/professor/rubrics');
    } catch (err: any) {
      setDeleting(false);
      showError(
        'Delete Failed',
        err.response?.data?.message ||
          'Failed to delete rubric. It may be linked to an assignment.',
      );
    }
  };

  const getEvaluationMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      unit_test: 'Unit Test',
      gpt_semantic: 'GPT Semantic',
      hybrid: 'Hybrid',
      manual: 'Manual Review',
    };
    return labels[method] || method;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getChartData = () => {
    if (!rubric?.criteria) return [];
    return rubric.criteria.map((criterion) => ({
      name: criterion.title,
      value: criterion.maxPoints,
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading rubric...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!rubric) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileJson className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Rubric Not Found</h3>
              <p className="text-muted-foreground mb-6">The requested rubric could not be found</p>
              <Button onClick={() => router.push('/professor/rubrics')}>Back to Rubrics</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push('/professor/rubrics')}
            className="mb-2 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Rubrics
          </Button>
          <h1 className="text-3xl font-bold">{rubric.name}</h1>
          {rubric.description && <p className="text-muted-foreground mt-1">{rubric.description}</p>}
        </div>
        <div className="flex gap-2">
          {!rubric.assignment && (
            <>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Assignment Link Warning */}
      {rubric.assignment && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Linked to Assignment</p>
                <p className="text-sm text-blue-700 mt-1">
                  This rubric is linked to the assignment &quot;{rubric.assignment.title}&quot; and
                  cannot be deleted. Remove the link from the assignment first.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Overview Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Total Points</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">{rubric.totalPoints}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Passing Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-600">{rubric.passingGrade}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {((rubric.passingGrade / rubric.totalPoints) * 100).toFixed(1)}% required
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-600">{rubric.criteria?.length || 0}</p>
            <p className="text-sm text-muted-foreground mt-2">Evaluation criteria</p>
          </CardContent>
        </Card>
      </div>

      {/* Criteria Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Grading Criteria</CardTitle>
          <CardDescription>Detailed breakdown of evaluation criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Evaluation Method</TableHead>
                <TableHead>Weight</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rubric.criteria?.map((criterion: Criterion, index: number) => (
                <TableRow key={criterion.id || index}>
                  <TableCell>
                    <p className="font-medium">{criterion.title}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {criterion.gptInstructions || 'No description'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{criterion.maxPoints}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: EVALUATION_METHOD_COLORS[criterion.evaluationMethod],
                        color: EVALUATION_METHOD_COLORS[criterion.evaluationMethod],
                      }}
                    >
                      {getEvaluationMethodLabel(criterion.evaluationMethod)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {((criterion.maxPoints / rubric.totalPoints) * 100).toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Points Distribution Chart */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Points Distribution</CardTitle>
          <CardDescription>Visual breakdown of points by criterion</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={getChartData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}pts`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {getChartData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Created</p>
            <p className="text-base">{formatDate(rubric.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
            <p className="text-base">{formatDate(rubric.updatedAt)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Assignment Link</p>
            <p className="text-base">
              {rubric.assignment ? (
                <Badge>{rubric.assignment.title}</Badge>
              ) : (
                <span className="text-muted-foreground">Not linked</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Rubric ID</p>
            <p className="text-sm font-mono">{rubric.id}</p>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Rubric
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{rubric.name}&quot;? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
