import { Mail, Chrome, Facebook } from "lucide-react";

export function ProviderIcon({ provider }: { provider: string }) {
  if (provider?.includes("google")) {
    return <Chrome className="h-4 w-4 text-red-500" />;
  }

  if (provider?.includes("facebook")) {
    return <Facebook className="h-4 w-4 text-blue-600" />;
  }

  return <Mail className="h-4 w-4 text-muted-foreground" />;
}

