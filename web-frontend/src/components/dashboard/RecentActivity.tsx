import React from "react";

export function RecentActivity() {
  return (
    <div className="bg-white border border-[var(--border)] rounded-[var(--r)] p-[18px]">
      <div className="text-[13.5px] font-bold m-0 mb-4 flex justify-between items-center">Recent Activity</div>
      <table className="w-full border-collapse text-[13.5px]">
        <thead>
          <tr>
            <th className="text-left text-[11.5px] uppercase tracking-[0.04em] text-[var(--faint)] font-bold px-[10px] pb-3">Problem</th>
            <th className="text-left text-[11.5px] uppercase tracking-[0.04em] text-[var(--faint)] font-bold px-[10px] pb-3">Platform</th>
            <th className="text-left text-[11.5px] uppercase tracking-[0.04em] text-[var(--faint)] font-bold px-[10px] pb-3">Difficulty</th>
            <th className="text-left text-[11.5px] uppercase tracking-[0.04em] text-[var(--faint)] font-bold px-[10px] pb-3">Result</th>
            <th className="text-left text-[11.5px] uppercase tracking-[0.04em] text-[var(--faint)] font-bold px-[10px] pb-3">Date</th>
            <th className="text-right text-[11.5px] uppercase tracking-[0.04em] text-[var(--faint)] font-bold px-[10px] pb-3">GitHub</th>
          </tr>
        </thead>
        <tbody>
          <tr className="hover:bg-[var(--subtle)]">
            <td className="py-[11px] px-[10px] border-t border-[var(--border)] font-semibold">Two Sum</td>
            <td className="py-[11px] px-[10px] border-t border-[var(--border)]"><div className="inline-flex items-center gap-1.5 text-[var(--muted)]"><div className="w-[18px] h-[18px] rounded-[5px] grid place-items-center text-white text-[9px] font-extrabold font-mono bg-[#ffa116]">LC</div> LeetCode</div></td>
            <td className="py-[11px] px-[10px] border-t border-[var(--border)]"><span className="text-[11px] font-bold py-[3px] px-[8px] rounded-[6px] bg-[var(--green-soft)] text-[var(--green)]">Easy</span></td>
            <td className="py-[11px] px-[10px] border-t border-[var(--border)] text-[var(--accent-2)] font-semibold text-[12.5px]">Accepted</td>
            <td className="py-[11px] px-[10px] border-t border-[var(--border)] text-right text-[var(--faint)] text-[12px]">2 hrs ago</td>
            <td className="py-[11px] px-[10px] border-t border-[var(--border)] text-right text-[var(--faint)] text-[12px]"><a href="#" className="font-mono text-[11.5px] text-[var(--accent-2)]">gaurav/sync#1</a></td>
          </tr>
          <tr className="hover:bg-[var(--subtle)]">
            <td className="py-[11px] px-[10px] border-t border-[var(--border)] font-semibold">Watermelon</td>
            <td className="py-[11px] px-[10px] border-t border-[var(--border)]"><div className="inline-flex items-center gap-1.5 text-[var(--muted)]"><div className="w-[18px] h-[18px] rounded-[5px] grid place-items-center text-white text-[9px] font-extrabold font-mono bg-[#1f8acb]">CF</div> Codeforces</div></td>
            <td className="py-[11px] px-[10px] border-t border-[var(--border)]"><span className="text-[11px] font-bold py-[3px] px-[8px] rounded-[6px] bg-[var(--accent-soft)] text-[var(--accent)] font-mono">800</span></td>
            <td className="py-[11px] px-[10px] border-t border-[var(--border)] text-[var(--accent-2)] font-semibold text-[12.5px]">Accepted</td>
            <td className="py-[11px] px-[10px] border-t border-[var(--border)] text-right text-[var(--faint)] text-[12px]">Yesterday</td>
            <td className="py-[11px] px-[10px] border-t border-[var(--border)] text-right text-[var(--faint)] text-[12px]"><a href="#" className="font-mono text-[11.5px] text-[var(--accent-2)]">gaurav/sync#4a</a></td>
          </tr>
          <tr className="hover:bg-[var(--subtle)]">
            <td className="py-[11px] px-[10px] border-t border-[var(--border)] font-semibold">Merge K Sorted Lists</td>
            <td className="py-[11px] px-[10px] border-t border-[var(--border)]"><div className="inline-flex items-center gap-1.5 text-[var(--muted)]"><div className="w-[18px] h-[18px] rounded-[5px] grid place-items-center text-white text-[9px] font-extrabold font-mono bg-[#ffa116]">LC</div> LeetCode</div></td>
            <td className="py-[11px] px-[10px] border-t border-[var(--border)]"><span className="text-[11px] font-bold py-[3px] px-[8px] rounded-[6px] bg-[var(--red-soft)] text-[var(--rose)]">Hard</span></td>
            <td className="py-[11px] px-[10px] border-t border-[var(--border)] text-[var(--accent-2)] font-semibold text-[12.5px]">Accepted</td>
            <td className="py-[11px] px-[10px] border-t border-[var(--border)] text-right text-[var(--faint)] text-[12px]">May 2</td>
            <td className="py-[11px] px-[10px] border-t border-[var(--border)] text-right text-[var(--faint)] text-[12px]"><a href="#" className="font-mono text-[11.5px] text-[var(--accent-2)]">gaurav/sync#23</a></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
