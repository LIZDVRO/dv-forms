/**
 * Renders the small Markdown subset used in agreement.ts:
 * ## / ### headings, paragraphs, "- " bullets, pipe tables, **bold**, [text](url).
 */
import type { ReactNode } from "react";

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(
        <strong key={`${key}-${i++}`} className="font-semibold text-slate-900">
          {inline(m[1], `${key}-${i}`)}
        </strong>,
      );
    } else {
      const external = /^https?:/.test(m[3]);
      out.push(
        <a
          key={`${key}-${i++}`}
          href={m[3]}
          className="font-medium text-liz underline"
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {m[2]}
        </a>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const cells = (row: string) =>
  row
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());

export function Markdown({ source }: { source: string }) {
  const blocks = source.trim().split(/\n\s*\n/);
  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
      {blocks.map((block, b) => {
        const key = `b${b}`;
        const lines = block.split("\n");
        if (block.startsWith("## ")) {
          return (
            <h2 key={key} className="pt-4 text-xl font-semibold tracking-tight text-slate-900">
              {inline(block.slice(3), key)}
            </h2>
          );
        }
        if (block.startsWith("### ")) {
          return (
            <h3 key={key} className="pt-2 text-base font-semibold text-slate-900">
              {inline(block.slice(4), key)}
            </h3>
          );
        }
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={key} className="list-disc space-y-1.5 pl-5">
              {lines.map((l, i) => (
                <li key={`${key}-${i}`}>{inline(l.slice(2), `${key}-${i}`)}</li>
              ))}
            </ul>
          );
        }
        if (lines.every((l) => l.trim().startsWith("|"))) {
          const [head, , ...rows] = lines;
          return (
            <div key={key} className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-900">
                  <tr>
                    {cells(head).map((c, i) => (
                      <th key={i} className="px-3 py-2 font-semibold">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rows.map((r, ri) => (
                    <tr key={ri} className="align-top">
                      {cells(r).map((c, ci) => (
                        <td key={ci} className={`px-3 py-2 ${ci === 0 ? "font-medium text-slate-900 sm:w-48" : ""}`}>
                          {inline(c, `${key}-${ri}-${ci}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return <p key={key}>{inline(block.replace(/\n/g, " "), key)}</p>;
      })}
    </div>
  );
}
