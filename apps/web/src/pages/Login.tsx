import { AuthLayout } from '@/components/auth/AuthLayout';
import { SignInForm } from '@/components/auth/SignInForm';

export function Login() {
  return (
    <AuthLayout>
      <SignInForm />
    </AuthLayout>
  );
}
