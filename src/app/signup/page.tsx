import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export default function SignupPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-10">
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </div>
  );
}
