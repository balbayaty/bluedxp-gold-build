import { RequireAuthLayout } from "@/components/auth/RequireAuthLayout";

export default function LoadPlanningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuthLayout>{children}</RequireAuthLayout>;
}
