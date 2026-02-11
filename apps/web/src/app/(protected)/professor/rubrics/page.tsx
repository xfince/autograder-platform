'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileJson, Trash2, Eye, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { rubricsService, type Rubric } from '@/services';

export default function RubricsPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rubricToDelete, setRubricToDelete] = useState<Rubric | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchRubrics();
  }, []);

  const fetchRubrics = async () => {
    try {
      setLoading(true);
      const data = await rubricsService.getAll();
      setRubrics(data);
    } catch (err) {
      error('Error', 'Failed to load rubrics. Please try again.');
      console.error('Error fetching rubrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!rubricToDelete) return;

    try {
      setDeleting(true);
      await rubricsService.delete(rubricToDelete.id);
      success('Success', `Rubric "${rubricToDelete.name}" has been deleted.`);
      setRubrics(rubrics.filter((r) => r.id !== rubricToDelete.id));
      setDeleteDialogOpen(false);
    } catch (err: any) {
      error(
        'Delete Failed',
        err.response?.data?.message ||
          'Failed to delete rubric. It may be linked to an assignment.',
      );
    } finally {
      setDeleting(false);
      setRubricToDelete(null);
    }
  };

  const openDeleteDialog = (rubric: Rubric) => {
    setRubricToDelete(rubric);
    setDeleteDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Rubrics</h1>
            <p className="text-muted-foreground mt-1">
              Manage grading rubrics for your assignments
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading rubrics...</p>
              </div>
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
          <h1 className="text-3xl font-bold">Rubrics</h1>
          <p className="text-muted-foreground mt-1">Manage grading rubrics for your assignments</p>
        </div>
        <Button onClick={() => router.push('/professor/rubrics/upload')} className="gap-2">
          <Plus className="h-4 w-4" />
          Upload Rubric
        </Button>
      </div>

      {/* Empty State */}
      {rubrics.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileJson className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Rubrics Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Upload a rubric JSON file to start grading assignments with structured criteria.
              </p>
              <Button onClick={() => router.push('/professor/rubrics/upload')} className="gap-2">
                <Plus className="h-4 w-4" />
                Upload Your First Rubric
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rubrics Table */}
      {rubrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Rubrics ({rubrics.length})</CardTitle>
            <CardDescription>View and manage your grading rubrics</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Total Points</TableHead>
                  <TableHead>Passing Grade</TableHead>
                  <TableHead>Criteria</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rubrics.map((rubric) => (
                  <TableRow key={rubric.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{rubric.name}</p>
                        {rubric.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {rubric.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{rubric.totalPoints}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{rubric.passingGrade}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {rubric.criteria?.length || 0} criteria
                      </span>
                    </TableCell>
                    <TableCell>
                      {rubric.assignment ? (
                        <Badge variant="default">{rubric.assignment.title}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not linked</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(rubric.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/professor/rubrics/${rubric.id}`)}
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        {!rubric.assignment && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(rubric)}
                            className="gap-1 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Rubric
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{rubricToDelete?.name}&quot;? This action cannot
              be undone.
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
