'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileJson, CheckCircle, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import ReactJson from 'react-json-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { rubricsService } from '@/services';

interface ValidationError {
  field: string;
  message: string;
}

interface UploadState {
  file: File | null;
  jsonData: any;
  isValidating: boolean;
  isUploading: boolean;
  validationErrors: ValidationError[];
  uploadSuccess: boolean;
  uploadedRubricId: string | null;
}

export default function UploadRubricPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [state, setState] = useState<UploadState>({
    file: null,
    jsonData: null,
    isValidating: false,
    isUploading: false,
    validationErrors: [],
    uploadSuccess: false,
    uploadedRubricId: null,
  });
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const validateJsonStructure = (data: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Validate top-level structure
    if (!data.rubric || !data.criteria) {
      errors.push({
        field: 'structure',
        message: 'JSON must have "rubric" and "criteria" properties at root level',
      });
      return errors;
    }

    const rubric = data.rubric;
    const criteria = data.criteria;

    // Validate rubric fields
    if (!rubric.name || typeof rubric.name !== 'string') {
      errors.push({
        field: 'rubric.name',
        message: 'Rubric name is required and must be a string',
      });
    }

    if (typeof rubric.totalPoints !== 'number' || rubric.totalPoints <= 0) {
      errors.push({
        field: 'rubric.totalPoints',
        message: 'Total points must be a positive number',
      });
    }

    if (typeof rubric.passingGrade !== 'number' || rubric.passingGrade < 0) {
      errors.push({
        field: 'rubric.passingGrade',
        message: 'Passing grade must be a non-negative number',
      });
    }

    if (rubric.passingGrade > rubric.totalPoints) {
      errors.push({
        field: 'rubric.passingGrade',
        message: 'Passing grade cannot exceed total points',
      });
    }

    // Validate criteria array
    if (!Array.isArray(criteria) || criteria.length === 0) {
      errors.push({
        field: 'criteria',
        message: 'Criteria must be a non-empty array',
      });
    } else {
      let calculatedTotal = 0;
      criteria.forEach((criterion: any, index: number) => {
        if (!criterion.title || typeof criterion.title !== 'string') {
          errors.push({
            field: `criteria[${index}].title`,
            message: `Criterion ${index + 1} must have a title`,
          });
        }

        if (typeof criterion.maxPoints !== 'number' || criterion.maxPoints <= 0) {
          errors.push({
            field: `criteria[${index}].maxPoints`,
            message: `Criterion ${index + 1} must have positive maxPoints`,
          });
        } else {
          calculatedTotal += criterion.maxPoints;
        }

        const validMethods = ['unit_test', 'gpt_semantic', 'hybrid'];
        if (!criterion.evaluationMethod || !validMethods.includes(criterion.evaluationMethod)) {
          errors.push({
            field: `criteria[${index}].evaluationMethod`,
            message: `Criterion ${index + 1} must have a valid evaluation method: ${validMethods.join(', ')}`,
          });
        }

        if (!criterion.gptInstructions || typeof criterion.gptInstructions !== 'string') {
          errors.push({
            field: `criteria[${index}].gptInstructions`,
            message: `Criterion ${index + 1} must have gptInstructions`,
          });
        }
      });

      // Validate total points match
      if (rubric.totalPoints && calculatedTotal !== rubric.totalPoints) {
        errors.push({
          field: 'totalPoints',
          message: `Total points (${rubric.totalPoints}) must equal sum of criteria maxPoints (${calculatedTotal})`,
        });
      }
    }

    return errors;
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      showError('Invalid File', 'Please upload a valid JSON file');
      return;
    }

    setState((prev) => ({ ...prev, file, isValidating: true }));

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      // Perform client-side validation
      const validationErrors = validateJsonStructure(jsonData);

      setState((prev) => ({
        ...prev,
        jsonData,
        validationErrors,
        isValidating: false,
      }));

      if (validationErrors.length === 0) {
        success('Validation Passed', 'Rubric JSON structure is valid');
      }
    } catch (err) {
      showError('Parse Error', 'Failed to parse JSON file. Please check the file format.');
      setState((prev) => ({
        ...prev,
        file: null,
        jsonData: null,
        isValidating: false,
        validationErrors: [{ field: 'file', message: 'Invalid JSON format' }],
      }));
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processFile(e.dataTransfer.files[0]);
      }
    },
    [showError, success],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!state.file || state.validationErrors.length > 0) {
      return;
    }

    setState((prev) => ({ ...prev, isUploading: true }));

    try {
      const rubric = await rubricsService.uploadJson(state.file);
      setState((prev) => ({
        ...prev,
        isUploading: false,
        uploadSuccess: true,
        uploadedRubricId: rubric.id,
      }));
      success('Upload Successful', `Rubric "${rubric.name}" has been created`);
    } catch (err: any) {
      setState((prev) => ({ ...prev, isUploading: false }));
      showError(
        'Upload Failed',
        err.response?.data?.message || 'Failed to upload rubric. Please try again.',
      );
    }
  };

  const resetUpload = () => {
    setState({
      file: null,
      jsonData: null,
      isValidating: false,
      isUploading: false,
      validationErrors: [],
      uploadSuccess: false,
      uploadedRubricId: null,
    });
  };

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
          <h1 className="text-3xl font-bold">Upload Rubric</h1>
          <p className="text-muted-foreground mt-1">
            Upload a JSON file containing your grading rubric
          </p>
        </div>
      </div>

      {!state.uploadSuccess ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload JSON File</CardTitle>
                <CardDescription>
                  Drag and drop or click to select a rubric JSON file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <FileJson className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">
                    {state.file ? state.file.name : 'Drop JSON file here'}
                  </p>
                  <p className="text-sm text-muted-foreground">or click to browse your files</p>
                </div>

                {state.isValidating && (
                  <div className="mt-4">
                    <Progress value={50} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      Validating rubric structure...
                    </p>
                  </div>
                )}

                {state.file && !state.isValidating && (
                  <div className="mt-4 space-y-3">
                    <Alert
                      variant={state.validationErrors.length === 0 ? 'default' : 'destructive'}
                    >
                      {state.validationErrors.length === 0 ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <AlertTitle>Validation Passed</AlertTitle>
                          <AlertDescription>
                            Rubric structure is valid and ready to upload
                          </AlertDescription>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4" />
                          <AlertTitle>Validation Failed</AlertTitle>
                          <AlertDescription>
                            Found {state.validationErrors.length} error(s):
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              {state.validationErrors.map((error, idx) => (
                                <li key={idx} className="text-sm">
                                  <strong>{error.field}:</strong> {error.message}
                                </li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </>
                      )}
                    </Alert>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleUpload}
                        disabled={state.validationErrors.length > 0 || state.isUploading}
                        className="flex-1 gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {state.isUploading ? 'Uploading...' : 'Upload Rubric'}
                      </Button>
                      <Button variant="outline" onClick={resetUpload}>
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Format Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Format Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium mb-1">Root Structure:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>rubric: Object (rubric metadata)</li>
                    <li>criteria: Array (grading criteria)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium mb-1">Rubric Object:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>name: String</li>
                    <li>description: String (optional)</li>
                    <li>totalPoints: Number (sum of criteria maxPoints)</li>
                    <li>passingGrade: Number (minimum score)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium mb-1">Criterion Fields:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>title: String</li>
                    <li>maxPoints: Number (positive)</li>
                    <li>
                      evaluationMethod: &quot;unit_test&quot; | &quot;gpt_semantic&quot; |
                      &quot;hybrid&quot;
                    </li>
                    <li>gptInstructions: String (required)</li>
                    <li>weight: Number (optional, default 1.0)</li>
                    <li>levels: Object (optional, grading levels)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>JSON Preview</CardTitle>
                <CardDescription>
                  {state.jsonData ? 'Review your rubric structure' : 'Upload a file to see preview'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {state.jsonData ? (
                  <div className="max-h-150 overflow-auto border rounded-lg p-4 bg-gray-50">
                    <ReactJson
                      src={state.jsonData}
                      theme="rjv-default"
                      displayDataTypes={false}
                      displayObjectSize={false}
                      enableClipboard={false}
                      collapsed={2}
                    />
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileJson className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No file uploaded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Success State */
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <CheckCircle className="h-20 w-20 mx-auto text-green-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Upload Successful!</h2>
              <p className="text-muted-foreground mb-6">
                Your rubric has been created and is ready to use
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => router.push(`/professor/rubrics/${state.uploadedRubricId}`)}
                  className="gap-2"
                >
                  View Rubric
                </Button>
                <Button variant="outline" onClick={resetUpload}>
                  Upload Another
                </Button>
                <Button variant="outline" onClick={() => router.push('/professor/rubrics')}>
                  Back to List
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
