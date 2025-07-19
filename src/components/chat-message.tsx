import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  RiFileCopyLine,
  RiBookLine,
  RiLoopRightFill,
  RiCheckLine,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { clean, extractThinking } from "@/lib/formatter";
import Markdown from "@/components/markdown";
import TypingIndicator from "@/components/typing-indicator";

type ChatMessageProps = {
  isUser?: boolean;
  children: React.ReactNode;
  thinking?: boolean;
};

export function ChatMessage({ isUser, children, thinking }: ChatMessageProps) {
  // Reasoning/copy logic for assistant messages
  const [showReasoning, setShowReasoning] = useState(false);
  const [copied, setCopied] = useState(false);

  // Only process as string if it's actually a string
  const isStringContent = typeof children === 'string';
  const thinkingText = isStringContent ? extractThinking(children as string) : '';
  const cleaned = isStringContent ? clean(children as string) : '';

  // Copy markdown content (not just plain text)
  const handleCopy = async () => {
    const textToCopy = isStringContent ? cleaned : String(children);
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <article
      className={cn(
        "flex items-start gap-4 text-[15px] leading-relaxed mb-4",
        isUser && "justify-end",
      )}
    >
      <img
        className={cn(
          "rounded-full",
          isUser ? "order-1" : "border border-black/[0.08] shadow-sm",
        )}
        src={
          isUser
            ? "https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/exp2/user-02_mlqqqt.png"
            : "https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/exp2/user-01_i5l7tp.png"
        }
        alt={isUser ? "User profile" : "Bart logo"}
        width={40}
        height={40}
      />
      <div
        className={cn(isUser ? "bg-muted px-4 py-3 rounded-xl" : "space-y-4")}
      >
        <div className="flex flex-col gap-3">
          <p className="sr-only">{isUser ? "You" : "Bart"} said:</p>
          {/* Reasoning/copy UI for assistant messages */}
          {!isUser ? (
            <div>
              {thinking ? (
                <TypingIndicator />
              ) : showReasoning ? (
                <pre className="whitespace-pre-wrap">{thinkingText}</pre>
              ) : isStringContent ? (
                <Markdown>{cleaned}</Markdown>
              ) : (
                children
              )}
              {!thinking && (
                <div className="flex gap-2 mt-2">
                  {thinkingText && (
                    <Button size="sm" onClick={() => setShowReasoning(!showReasoning)}>
                      {showReasoning ? 'Hide' : 'Show'} Reasoning
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            children
          )}
        </div>
        {!isUser && !thinking && (
          <MessageActions onCopy={handleCopy} copied={copied} />
        )}
      </div>
    </article>
  );
}

type ActionButtonProps = {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
};

function ActionButton({ icon, label, onClick, active }: ActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={cn(
            "relative text-muted-foreground/80 hover:text-foreground transition-colors size-8 flex items-center justify-center before:absolute before:inset-y-1.5 before:left-0 before:w-px before:bg-border first:before:hidden first-of-type:rounded-s-lg last-of-type:rounded-e-lg focus-visible:z-10 outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring/70",
            active && "text-foreground"
          )}
          onClick={onClick}
        >
          {icon}
          <span className="sr-only">{label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="dark px-2 py-1 text-xs">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function MessageActions({ onCopy, copied }: { onCopy: () => void; copied: boolean }) {
  return (
    <div className="relative inline-flex bg-white rounded-md border border-black/[0.08] shadow-sm -space-x-px">
      <TooltipProvider delayDuration={0}>
        <ActionButton
          icon={<RiFileCopyLine size={16} />}
          label={copied ? "Copied!" : "Copy"}
          onClick={onCopy}
          active={copied}
        />
        <ActionButton icon={<RiBookLine size={16} />} label="Bookmark" />
        <ActionButton icon={<RiLoopRightFill size={16} />} label="Refresh" />
        <ActionButton icon={<RiCheckLine size={16} />} label="Approve" />
      </TooltipProvider>
    </div>
  );
}
