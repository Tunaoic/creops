import { ExternalLink } from "lucide-react";
import type { TaskOutputType } from "@/types";

/**
 * Readonly rendering of a task's submitted output.
 *
 * Used on the task detail page when the task is in any state OTHER than
 * editable (i.e., status === submitted / approved, or viewer is not the
 * assignee). The submit form ({@link TaskGenericView} et al.) is the
 * counterpart for the editable state.
 *
 * Renders differently per output type:
 * - text / long_text / markdown → multi-line text
 * - file → external-link card with the URL
 * - datetime → localized date+time
 * - chips → tag pills
 */
export function TaskOutputDisplay({
  outputType,
  outputValue,
  templateItemKey,
  locale = "en",
}: {
  outputType: TaskOutputType;
  outputValue: unknown;
  templateItemKey: string;
  locale?: "en" | "vi";
}) {
  const heading = templateItemKey.replace(/_/g, " ");
  const emptyLabel = locale === "vi" ? "Chưa có nội dung" : "No output yet";

  const isText =
    outputType === "text" ||
    outputType === "long_text" ||
    outputType === "markdown";
  const isFile = outputType === "file";
  const isDatetime = outputType === "datetime";
  const isChips = outputType === "chips";

  const stringValue = typeof outputValue === "string" ? outputValue : "";
  const isEmpty =
    outputValue === null ||
    outputValue === undefined ||
    (typeof outputValue === "string" && outputValue.trim() === "");

  return (
    <section className="bg-surface rounded-2xl border border-border p-5">
      <h3 className="text-headline text-text mb-3 capitalize">{heading}</h3>

      {isEmpty ? (
        <p className="text-[14px] text-text-subtle">{emptyLabel}</p>
      ) : (
        <>
          {isText && (
            <div className="text-[15px] leading-relaxed text-text whitespace-pre-wrap break-words">
              {stringValue}
            </div>
          )}

          {isFile && (
            <a
              href={stringValue}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-border bg-surface-elevated hover:bg-surface-hover transition-colors max-w-full"
            >
              <ExternalLink
                className="w-4 h-4 text-text-muted shrink-0"
                strokeWidth={1.75}
              />
              <span className="text-[14px] text-text truncate min-w-0">
                {stringValue}
              </span>
              <span className="text-[13px] text-text-subtle shrink-0">
                {locale === "vi" ? "Mở" : "Open"}
              </span>
            </a>
          )}

          {isDatetime && (
            <div className="text-[15px] text-text tabular-nums">
              {formatDateTime(stringValue, locale)}
            </div>
          )}

          {isChips && (
            <div className="flex flex-wrap gap-1.5">
              {stringValue
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .map((tag, i) => (
                  <span
                    key={i}
                    className="text-[13px] font-medium px-2.5 py-0.5 rounded-full bg-surface-elevated text-text"
                  >
                    {tag}
                  </span>
                ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function formatDateTime(iso: string, locale: "en" | "vi"): string {
  if (!iso) return "";
  // datetime-local inputs produce "YYYY-MM-DDTHH:mm" without timezone — keep
  // local interpretation. Date constructor accepts this form.
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(locale === "vi" ? "vi-VN" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
