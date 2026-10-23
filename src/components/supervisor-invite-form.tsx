"use client";

import { useActionState } from "react";
import { inviteSupervisor } from "@/server/rentflow/supervisor-actions";

type InviteState = {
  token?: string;
  expiresAt?: string;
  error?: string;
};

async function inviteAction(_previous: InviteState, formData: FormData): Promise<InviteState> {
  try {
    const result = await inviteSupervisor(formData);
    return { token: result.token, expiresAt: result.expiresAt };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create invite." };
  }
}

export function SupervisorInviteForm() {
  const [state, action, pending] = useActionState(inviteAction, {});
  const invitePath = state.token ? `/supervisors/accept?token=${encodeURIComponent(state.token)}` : null;

  return (
    <div className="rf-card p-6">
      <h2 className="font-semibold">Invite supervisor</h2>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">The raw token is shown once and is never stored in the database. Share the generated link securely.</p>
      <form action={action} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input name="email" type="email" required placeholder="supervisor@example.com" className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm" />
        <button type="submit" disabled={pending} className="rf-button rf-button-dark">{pending ? "Creating…" : "Create invite"}</button>
      </form>
      {state.error && <p className="mt-4 text-sm text-red-700">{state.error}</p>}
      {invitePath && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-medium text-emerald-900">One-time invite path</p>
          <code className="mt-2 block break-all text-xs text-emerald-950">{invitePath}</code>
          {state.expiresAt && <p className="mt-2 text-xs text-emerald-800">Expires: {new Date(state.expiresAt).toLocaleString()}</p>}
        </div>
      )}
    </div>
  );
}
