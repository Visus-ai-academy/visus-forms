import { Toaster } from "sonner";

export default function PublicFormLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Toaster position="bottom-center" richColors />
    </>
  );
}
