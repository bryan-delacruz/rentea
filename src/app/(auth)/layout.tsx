import { AuthShell } from "@/ui/templates/AuthShell";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
