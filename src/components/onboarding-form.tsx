"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { renameWorkspace } from "@/db/actions";

export function OnboardingForm({
  workspaceId,
  initialName,
}: {
  workspaceId: string;
  initialName: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      await renameWorkspace(workspaceId, trimmed);
      toast.success(`Workspace ready: ${trimmed}`);
      router.push("/");
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="block text-[14px] font-medium text-text mb-2">
          Workspace name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Khôi Thịnh Studio"
          className="w-full px-4 py-3 text-[16px]"
          autoFocus
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!name.trim() || pending}
          className="btn-primary inline-flex items-center gap-2 text-[15px] disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
          )}
          Continue
        </button>
      </div>
    </form>
  );
}
