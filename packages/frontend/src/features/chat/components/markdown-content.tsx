import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  content: string;
  memberMap?: Map<string, string>;
  className?: string;
}

function preprocessContent(
  content: string,
  memberMap?: Map<string, string>,
): string {
  if (!memberMap || memberMap.size === 0) return content;
  return content.replace(/@\[([^\]]+)\]/g, (_, userId) => {
    const name = memberMap.get(userId);
    return name ? `**@${name}**` : `@unknown`;
  });
}

export function MarkdownContent({
  content,
  memberMap,
  className,
}: MarkdownContentProps) {
  const processed = preprocessContent(content, memberMap);

  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        "prose-p:my-0 prose-p:leading-relaxed",
        "prose-pre:my-1 prose-code:text-xs",
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        "prose-img:max-w-xs prose-img:rounded",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ children, href, ...props }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
              {children}
            </a>
          ),
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}
