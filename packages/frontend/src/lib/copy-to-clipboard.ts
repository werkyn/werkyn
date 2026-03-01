/**
 * Copy text to clipboard with fallback for contexts where
 * navigator.clipboard is unavailable (e.g. inside dialogs,
 * non-secure origins, or when the document isn't focused).
 */
export async function copyToClipboard(text: string): Promise<void> {
  // Try the modern API first
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to legacy approach
    }
  }

  // Legacy fallback using a temporary textarea
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}
