import { RequireAuthLayout } from "@/components/auth/RequireAuthLayout";

export default function TrackingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuthLayout>{children}</RequireAuthLayout>;
}
