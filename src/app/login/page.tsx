import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { safeNextPath } from "@/lib/auth-redirect";

type LoginContentProps = {
  searchParams: PageProps<"/login">["searchParams"];
};

async function LoginContent({ searchParams }: LoginContentProps) {
  const { next, registered } = await searchParams;
  return <LoginForm nextPath={safeNextPath(next)} registered={registered === "1"} />;
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthCard title="Log in">
      <Suspense fallback={null}>
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}
