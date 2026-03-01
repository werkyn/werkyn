/**
 * Copy text to clipboard. Works reliably inside Radix dialogs
 * and other focus-trapping contexts by using execCommand as the
 * primary approach and placing the temporary element inside the
 * active dialog so it's within the focus trap.
 */
export function copyToClipboard(text: string): void {
  // Find the closest dialog/portal container so the textarea
  // is inside any focus trap (e.g. Radix Dialog).
  const container =
    document.activeElement?.closest("[role='dialog']") ?? document.body;

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.cssText =
    "position:fixed;left:-9999px;top:-9999px;opacity:0;pointer-events:none";
  container.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    document.execCommand("copy");
  } finally {
    container.removeChild(textarea);
  }
}
