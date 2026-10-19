import { AuthLayout } from '@/components/auth/AuthLayout';
import { SignUpForm } from '@/components/auth/SignUpForm';

export function Signup() {
  return (
    <AuthLayout>
      <SignUpForm />
    </AuthLayout>
  );
}
