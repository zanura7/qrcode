import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/40 p-6 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">
        This page or QR code could not be found.
      </p>
      <Link href="/dashboard" className="text-sm underline">
        Go to dashboard
      </Link>
    </div>
  );
}
