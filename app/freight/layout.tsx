import { RequireAuthLayout } from "@/components/auth/RequireAuthLayout";

export default function FreightLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuthLayout>{children}</RequireAuthLayout>;
}
