"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/app";
import { useSession } from "@/components/admin/session";
import { PageHead } from "@/components/admin/shell";
import { useStore } from "@/components/admin/store";
import { IPlus, ITrash } from "@/components/icons";
import { CopyButton, ErrorBox, Loading, Spinner } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { dateOnly, dateTime, prettyPhone } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import { useApi } from "@/lib/hooks";
import type { InviteCreatedOut, InviteOut, MemberOut, SubscriptionOut } from "@/lib/types";

export default function StaffPage() {
  const { d, lang, toast, confirm } = useApp();
  const { me, reload: reloadMe } = useSession();
  const { id, isOwner, readOnly, tenant } = useStore();
  const router = useRouter();
  const members = useApi<MemberOut[]>(isOwner ? `/tenants/${id}/staff` : null);
  const invites = useApi<InviteOut[]>(isOwner ? `/tenants/${id}/staff/invites` : null);
  const sub = useApi<SubscriptionOut>(isOwner ? `/tenants/${id}/subscription` : null);
  const [created, setCreated] = useState<InviteCreatedOut | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  async function invite() {
    setBusy(true);
    setError(null);
    try {
      setCreated(await api<InviteCreatedOut>(`/tenants/${id}/staff/invites`, { method: "POST" }));
      invites.reload();
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setBusy(false);
    }
  }
  async function revoke(inv: InviteOut) {
    try {
      await api(`/tenants/${id}/staff/invites/${inv.id}`, { method: "DELETE" });
      invites.reload();
      if (created?.id === inv.id) setCreated(null);
    } catch (e) {
      toast((e as ApiError).readable, "err");
    }
  }
  async function removeMember(m: MemberOut) {
    if (!(await confirm({ title: d.common.areYouSure, text: fmt(d.staff.removeConfirm, { name: m.first_name }), danger: true, ok: d.common.remove }))) return;
    try {
      await api(`/tenants/${id}/staff/${m.user_id}`, { method: "DELETE" });
      members.reload();
      sub.reload();
    } catch (e) {
      toast((e as ApiError).readable, "err");
    }
  }
  async function leave() {
    if (!(await confirm({ title: d.staff.leave, text: d.staff.leaveConfirm, danger: true, ok: d.staff.leave }))) return;
    try {
      await api(`/tenants/${id}/staff/leave`, { method: "POST" });
      await reloadMe();
      router.replace("/admin?list=1");
    } catch (e) {
      toast((e as ApiError).readable, "err");
    }
  }

  if (!isOwner) {
    return (
      <>
        <PageHead title={d.staff.title} sub={d.staff.text} />
        <div className="card stack" style={{ maxWidth: 560 }}>
          <p>
            <strong>{tenant.name}</strong> · {d.enums.role.staff}
          </p>
          <button className="btn btn-danger btn-sm" style={{ alignSelf: "flex-start" }} onClick={leave}>
            {d.staff.leave}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead title={d.staff.title} sub={d.staff.text} />
      <div className="grid-2" style={{ alignItems: "start", maxWidth: 1100 }}>
        <div className="card stack">
          <div className="row-between">
            <h2>{d.staff.members}</h2>
            {sub.data && <span className="muted small">{fmt(d.staff.limit, { used: sub.data.staff_used, limit: sub.data.staff_limit })}</span>}
          </div>
          <ErrorBox error={members.error} onRetry={members.reload} />
          {!members.data ? (
            <Loading />
          ) : (
            members.data.map((m) => (
              <div key={m.user_id} className="row" style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                <span className="logo-prev" style={{ width: 42, height: 42, fontSize: 17, borderRadius: 12 }}>
                  {m.first_name.slice(0, 1).toUpperCase()}
                </span>
                <span className="grow">
                  <strong>
                    {m.first_name} {m.last_name ?? ""}
                  </strong>
                  {m.user_id === me.user.id && <span className="muted small"> ({d.staff.you})</span>}
                  <br />
                  <span className="muted xs">
                    {m.username ? `@${m.username} · ` : ""}
                    {m.phone ? `${prettyPhone(m.phone)} · ` : ""}
                    {fmt(d.staff.joined, { date: dateOnly(m.joined_at, lang) })}
                  </span>
                </span>
                <span className={`badge ${m.role === "owner" ? "b-info" : ""}`}>{d.enums.role[m.role]}</span>
                {m.role !== "owner" && !readOnly && (
                  <button className="icon-btn" onClick={() => removeMember(m)} aria-label={d.common.remove} title={d.common.remove}>
                    <ITrash size={16} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
        <div className="card stack">
          <h2>{d.staff.invite}</h2>
          <p className="muted small">{fmt(d.staff.inviteText, { days: 7 })}</p>
          <ErrorBox error={error} />
          <button className="btn btn-primary btn-sm" style={{ alignSelf: "flex-start" }} onClick={invite} disabled={busy || readOnly}>
            {busy ? <Spinner /> : <IPlus size={16} />} {d.staff.invite}
          </button>
          {created && (
            <div className="note note-ok stack-sm">
              <span className="small">{d.staff.inviteReady}</span>
              <code className="mono xs" style={{ wordBreak: "break-all" }}>{created.url}</code>
              <CopyButton text={created.url} className="btn btn-ink btn-xs" />
            </div>
          )}
          {invites.data && invites.data.length > 0 && (
            <div className="stack-sm">
              <strong className="small">{d.staff.openInvites}</strong>
              {invites.data.map((inv) => (
                <div key={inv.id} className="row-between small">
                  <span>
                    #{inv.id} · {fmt(d.staff.expiresAt, { date: dateTime(inv.expires_at, lang) })}
                  </span>
                  <button className="btn btn-danger btn-xs" onClick={() => revoke(inv)} disabled={readOnly}>
                    {d.staff.revoke}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
