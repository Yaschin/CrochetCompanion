import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Key, ExternalLink, AlertCircle } from "lucide-react";

/** True when an error looks like a missing/invalid OpenAI key. */
export function isApiKeyError(error: unknown): boolean {
  const s = String(error);
  return s.includes("OPENAI_API_KEY") || s.includes("API key") ||
    s.includes("authentication") || s.includes("401") || s.includes("403");
}

interface AiErrorOpts {
  /** What the user was trying to do, woven into the api-key message — e.g. "generate patterns". */
  action?: string;
  /** Title for the generic (unclassified) fallback toast. */
  fallbackTitle?: string;
}

/**
 * Classify an OpenAI-style failure and surface the appropriate toast
 * (api-key / rate-limit / timeout / billing / content-policy / generic).
 *
 * Consolidates the error-handling that was duplicated across PatternViewer's
 * mutations and PatternInput's wizard, so the messaging stays consistent.
 */
export function showAiErrorToast(error: unknown, opts: AiErrorOpts = {}): void {
  const { action = "generate patterns", fallbackTitle = "Something went wrong" } = opts;
  const s = String(error);

  if (isApiKeyError(error)) {
    toast({
      title: "OpenAI API Key Required",
      description: `Add a valid key to ${action}.`,
      variant: "apiWarning",
      action: (
        <ToastAction altText="Get Key" onClick={() => window.open("https://platform.openai.com/account/api-keys", "_blank")}>
          <Key className="mr-1 h-4 w-4" />Get API Key
        </ToastAction>
      ),
      duration: 10000,
    });
  } else if (s.toLowerCase().includes("rate limit") || s.includes("429")) {
    toast({ title: "Rate Limit Reached", description: "Please wait a few minutes and try again.", variant: "apiWarning", duration: 8000 });
  } else if (s.includes("timeout") || s.includes("timed out")) {
    toast({ title: "Request Timed Out", description: "Try again, or use a simpler request.", variant: "apiWarning", duration: 8000 });
  } else if (s.includes("billing") || s.includes("quota")) {
    toast({
      title: "OpenAI Billing Issue",
      description: "Check your OpenAI account.",
      variant: "apiWarning",
      action: (
        <ToastAction altText="Check Billing" onClick={() => window.open("https://platform.openai.com/account/billing", "_blank")}>
          <ExternalLink className="mr-1 h-4 w-4" />Check Billing
        </ToastAction>
      ),
      duration: 10000,
    });
  } else if (s.includes("content policy") || s.includes("safety")) {
    toast({
      title: "Content Policy Violation",
      description: "Your request may violate OpenAI's usage policy.",
      variant: "apiWarning",
      action: (
        <ToastAction altText="Learn More" onClick={() => window.open("https://openai.com/policies/usage-policies", "_blank")}>
          <AlertCircle className="mr-1 h-4 w-4" />Learn More
        </ToastAction>
      ),
      duration: 10000,
    });
  } else {
    toast({ title: fallbackTitle, description: s.substring(0, 80), variant: "destructive", duration: 6000 });
  }
}
