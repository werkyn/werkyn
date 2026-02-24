import DOMPurify from "dompurify";

interface SafeHtmlProps extends React.HTMLAttributes<HTMLDivElement> {
  html: string;
}

export function SafeHtml({ html, ...props }: SafeHtmlProps) {
  return (
    <div
      {...props}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
    />
  );
}
