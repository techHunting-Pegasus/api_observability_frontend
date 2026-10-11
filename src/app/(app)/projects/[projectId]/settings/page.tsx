"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, KeyRound, MailPlus, RefreshCw, ShieldCheck, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/form";
import { ConfirmDialog, Modal } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { useAsync } from "@/hooks/use-async";
import { errorMessage } from "@/lib/api/client";
import {
  addProjectMember,
  getProjectApiKey,
  getProjectMembers,
  getProjects,
  regenerateProjectApiKey,
  removeProjectMember,
  updateProjectMemberRole,
} from "@/lib/api/projects";
import { useAuth } from "@/features/auth/auth-provider";
import { formatDate } from "@/lib/utils/format";
import type { ProjectMember, ProjectRole } from "@/types";

export default function ProjectSettingsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const toast = useToast();
  const projects = useAsync((signal) => getProjects(signal), []);
  const members = useAsync((signal) => getProjectMembers(projectId, signal), [projectId]);
  const project = projects.data?.find((item) => item.id === projectId) ?? null;
  const currentMember = members.data?.find((member) => member.userId === user?.id || member.user.id === user?.id);
  const isOwner = currentMember?.role === "OWNER";

  const [email, setEmail] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<ProjectMember | null>(null);
  const [memberToPromote, setMemberToPromote] = useState<ProjectMember | null>(null);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeySource, setApiKeySource] = useState<"view" | "regenerated" | null>(null);
  const [loadingApiKey, setLoadingApiKey] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const canViewApiKey = currentMember?.role === "OWNER" || currentMember?.role === "APP_MANAGER";

  useEffect(() => {
    setApiKey(null);
    setApiKeySource(null);
    setCopyError(null);
  }, [projectId, currentMember?.role]);

  async function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAddError(null);
    const normalizedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setAddError("Enter a valid email address.");
      return;
    }

    setAdding(true);
    try {
      const response = await addProjectMember(projectId, normalizedEmail);
      setEmail("");
      toast.success(response.message || "Member added to the project.");
      members.reload();
    } catch (error) {
      setAddError(errorMessage(error));
    } finally {
      setAdding(false);
    }
  }

  async function changeMemberRole(member: ProjectMember, role: ProjectRole) {
    setActionError(null);
    setBusyMemberId(member.id);
    try {
      const response = await updateProjectMemberRole(projectId, member.userId, role);
      toast.success(response.message || "Member role updated.");
      members.reload();
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setBusyMemberId(null);
      setMemberToPromote(null);
    }
  }

  async function handleRemoveMember() {
    if (!memberToRemove) return;
    const member = memberToRemove;
    const response = await removeProjectMember(projectId, member.id);
    setMemberToRemove(null);
    toast.success(response.message || "Member removed from the project.");
    members.reload();
  }

  async function handleRegenerateApiKey() {
    try {
      const response = await regenerateProjectApiKey(projectId);
      setApiKey(response.apiKey);
      setApiKeySource("regenerated");
      setCopyError(null);
      setConfirmRegenerate(false);
      toast.success(response.message || "API key regenerated.");
    } catch (error) {
      setActionError(errorMessage(error));
      setConfirmRegenerate(false);
    }
  }

  async function handleViewApiKey() {
    setActionError(null);
    setLoadingApiKey(true);
    try {
      const response = await getProjectApiKey(projectId);
      setApiKey(response.apiKey);
      setApiKeySource("view");
      setCopyError(null);
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setLoadingApiKey(false);
    }
  }

  async function copyApiKey() {
    try {
      await navigator.clipboard.writeText(apiKey ?? "");
      setCopyError(null);
      toast.success("API key copied to clipboard.");
    } catch {
      setCopyError("Clipboard access was blocked. Select and copy the key manually.");
    }
  }

  if (projects.loading) {
    return (
      <div aria-busy="true" aria-label="Loading project settings">
        <Skeleton className="mb-4 h-4 w-32" />
        <Skeleton className="mb-6 h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (projects.error) {
    return <ErrorState error={projects.error} title="Unable to load project" description="Project settings could not be loaded." onRetry={projects.reload} />;
  }

  if (!project) {
    return <EmptyState title="Project not found" description="This project may have been deleted or you may not have access to it." />;
  }

  return (
    <>
      <Link href={`/projects/${projectId}`} className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to project
      </Link>
      <PageHeader
        title="Project settings"
        subtitle={
          <span>
            <span className="font-medium text-ink">{project.name}</span>
            <span className="mx-2">·</span>
            <span className="font-mono text-xs">{project.bundleId}</span>
          </span>
        }
      />

      {actionError && (
        <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <section className="mb-5 rounded-lg border border-line bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-ink-soft" />
            <div>
              <h2 className="text-sm font-semibold">Project members</h2>
              <p className="text-xs text-ink-faint">People who can access this project and its API logs.</p>
            </div>
          </div>
          <Button onClick={members.reload} disabled={members.loading} aria-label="Refresh project members">
            <RefreshCw className={members.loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} /> Refresh
          </Button>
        </div>

        {isOwner && (
          <form onSubmit={(event) => void handleAddMember(event)} className="grid gap-3 border-b border-line bg-canvas/40 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <Field label="Add an app manager" htmlFor="member-email" error={addError ?? undefined} hint="They must already have an account.">
              <Input
                id="member-email"
                type="email"
                autoComplete="email"
                placeholder="teammate@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={adding}
                aria-invalid={!!addError}
              />
            </Field>
            <Button type="submit" variant="primary" loading={adding}>
              <MailPlus className="h-4 w-4" /> {adding ? "Adding..." : "Add member"}
            </Button>
          </form>
        )}

        {members.loading ? (
          <div className="space-y-3 p-4" aria-busy="true" aria-label="Loading members">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : members.error ? (
          <div className="p-4">
            <ErrorState error={members.error} title="Unable to load members" description="Project membership could not be loaded." onRetry={members.reload} />
          </div>
        ) : members.data?.length ? (
          <ul className="divide-y divide-line">
            {members.data.map((member) => {
              const isSelf = member.userId === user?.id || member.user.id === user?.id;
              return (
                <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
                      {member.user.email.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {member.user.email}
                        {isSelf && <span className="ml-2 text-xs font-normal text-ink-faint">You</span>}
                      </p>
                      <p className="text-xs text-ink-faint">Added {formatDate(member.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOwner && !isSelf ? (
                      <>
                        <select
                          aria-label={`Role for ${member.user.email}`}
                          className="h-8 rounded-md border border-line-strong bg-white px-2 text-xs"
                          value={member.role}
                          disabled={busyMemberId === member.id}
                          onChange={(event) => {
                            const role = event.target.value as ProjectRole;
                            if (role === "OWNER") setMemberToPromote(member);
                            else void changeMemberRole(member, role);
                          }}
                        >
                          <option value="APP_MANAGER">App manager</option>
                          <option value="OWNER">Owner</option>
                        </select>
                        <Button
                          size="sm"
                          aria-label={`Remove ${member.user.email}`}
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => setMemberToRemove(member)}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </Button>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-ink-soft">
                        {member.role === "OWNER" && <ShieldCheck className="h-3.5 w-3.5" />}
                        {member.role === "OWNER" ? "Owner" : "App manager"}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-4 text-sm text-ink-soft">No project members found.</div>
        )}
        {!isOwner && !members.loading && !members.error && (
          <p className="border-t border-line px-4 py-3 text-xs text-ink-faint">
            Only the project owner can add or remove members, change roles, or regenerate the API key.
          </p>
        )}
      </section>

      {canViewApiKey && (
        <section className="rounded-lg border border-line bg-white">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-700">
                <KeyRound className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold">Project API key</h2>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-ink-soft">
                  View the key used by your app. Regenerating it immediately invalidates the current key.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" loading={loadingApiKey} onClick={() => void handleViewApiKey()}>
                <KeyRound className="h-3.5 w-3.5" /> {loadingApiKey ? "Loading key..." : "View API key"}
              </Button>
              {isOwner && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setActionError(null);
                    setConfirmRegenerate(true);
                  }}
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate key
                </Button>
              )}
            </div>
          </div>
          {!isOwner && (
            <p className="border-t border-line bg-canvas/40 px-4 py-3 text-xs text-ink-faint">
              App managers can view and copy the key. Only the project owner can regenerate it.
            </p>
          )}
        </section>
      )}

      <ConfirmDialog
        open={!!memberToRemove}
        title="Remove project member?"
        confirmLabel="Remove member"
        pendingLabel="Removing..."
        errorTitle="Unable to remove member"
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemoveMember}
      >
        <p>
          Remove <strong className="text-ink">{memberToRemove?.user.email}</strong> from this project? They will lose access to its logs.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={!!memberToPromote}
        title="Transfer project ownership?"
        confirmLabel="Transfer ownership"
        pendingLabel="Transferring..."
        errorTitle="Unable to transfer ownership"
        onClose={() => setMemberToPromote(null)}
        onConfirm={async () => {
          if (!memberToPromote) return;
          await changeMemberRole(memberToPromote, "OWNER");
        }}
      >
        <p>
          Make <strong className="text-ink">{memberToPromote?.user.email}</strong> the project owner? They will gain owner permissions and you will become an app manager.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmRegenerate}
        title="Regenerate API key?"
        confirmLabel="Regenerate key"
        pendingLabel="Regenerating..."
        errorTitle="Unable to regenerate API key"
        onClose={() => setConfirmRegenerate(false)}
        onConfirm={handleRegenerateApiKey}
      >
        <p>This immediately invalidates the existing key. Any app still using it will stop sending requests until updated.</p>
      </ConfirmDialog>

      <Modal
        open={!!apiKey}
        onClose={() => {
          setApiKey(null);
          setApiKeySource(null);
        }}
        title={apiKeySource === "regenerated" ? "New API key" : "Project API key"}
        dismissible={false}
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-soft">
            {apiKeySource === "regenerated"
              ? "Copy and securely store the new key. Close this dialog to hide it."
              : "This key is used by your app. Close this dialog to hide it."}
          </p>
          <code className="block break-all rounded-md border border-line bg-canvas px-3 py-2.5 font-mono text-xs">{apiKey}</code>
          {copyError && <p role="alert" className="text-xs text-red-600">{copyError}</p>}
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setApiKey(null);
                setApiKeySource(null);
              }}
            >
              Done
            </Button>
            <Button variant="primary" onClick={() => void copyApiKey()}>
              Copy API key
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
