import { RequireAuthLayout } from "@/components/auth/RequireAuthLayout";

export default function LoadDesignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuthLayout>{children}</RequireAuthLayout>;
}
