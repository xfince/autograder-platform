'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, CheckCircle2, Mail } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordResponse {
  message: string;
  resetToken?: string; // Only in development
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordFormData): Promise<ForgotPasswordResponse> => {
      const response = await apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', data);
      return response.data;
    },
    onSuccess: (data) => {
      setIsSubmitted(true);
      // In development, show the reset token for testing
      if (data.resetToken) {
        setDevToken(data.resetToken);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = forgotPasswordSchema.safeParse({ email });

    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    forgotPasswordMutation.mutate(result.data);
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
            <CardDescription>
              If an account with <strong>{email}</strong> exists, we&apos;ve sent a password reset
              link.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-4 text-center text-sm text-blue-700">
              <Mail className="mx-auto mb-2 h-5 w-5" />
              The link will expire in 1 hour.
            </div>

            {/* Development mode: Show reset token */}
            {devToken && (
              <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                <p className="text-xs font-semibold text-yellow-800 mb-2">
                  ⚠️ Development Mode Only
                </p>
                <p className="text-xs text-yellow-700 mb-2">
                  Use this link to reset your password:
                </p>
                <Link
                  href={`/reset-password?token=${devToken}`}
                  className="text-xs text-blue-600 hover:underline break-all"
                >
                  /reset-password?token={devToken.substring(0, 20)}...
                </Link>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsSubmitted(false);
                setDevToken(null);
              }}
            >
              Try a different email
            </Button>
            <Link
              href="/login"
              className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
          <CardDescription>
            Enter your email address and we&apos;ll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {forgotPasswordMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {forgotPasswordMutation.error instanceof Error
                    ? forgotPasswordMutation.error.message
                    : 'Something went wrong. Please try again.'}
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                disabled={forgotPasswordMutation.isPending}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={forgotPasswordMutation.isPending}>
              {forgotPasswordMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send Reset Link
            </Button>
            <Link
              href="/login"
              className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
