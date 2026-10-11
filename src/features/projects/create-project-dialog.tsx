"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Field, Input } from "@/components/ui/form";
import { Modal } from "@/components/ui/overlay";
import { createProject } from "@/lib/api/projects";
import { errorMessage } from "@/lib/api/client";
import type { Project } from "@/types";

const schema = z.object({
  name: z.string().trim().min(2, "Enter a project name (2+ characters)").max(80, "Keep it under 80 characters"),
  bundleId: z
    .string()
    .trim()
    .min(3, "Enter the app's bundle ID")
    .regex(/^[A-Za-z0-9]+([.-][A-Za-z0-9_-]+)+$/, "Use reverse-DNS format, e.g. com.company.app"),
});
type Values = z.infer<typeof schema>;

export function CreateProjectDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (p: Project) => void }) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  // The API key lives only in this component's state and is dropped as soon as the dialog closes.
  useEffect(() => {
    if (!open) {
      setApiKey(null);
      setServerError(null);
      reset();
    }
  }, [open, reset]);

  async function onSubmit(v: Values) {
    setServerError(null);
    try {
      const res = await createProject(v);
      onCreated({ ...res.project, updatedAt: res.project.createdAt });
      setApiKey(res.apiKey);
    } catch (e) {
      setServerError(errorMessage(e));
    }
  }

  if (apiKey) {
    return (
      <Modal open={open} onClose={onClose} title="Project created" dismissible={false}>
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> Project created successfully
        </div>
        <div className="mt-4">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink-soft">
            <KeyRound className="h-3.5 w-3.5" /> API Key
          </p>
          <code className="block break-all rounded-md border border-line bg-canvas px-3 py-2.5 font-mono text-xs">{apiKey}</code>
        </div>
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          This API key is shown only once. Store it securely — it can't be retrieved later.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <CopyButton text={apiKey} label="Copy API Key" size="md" />
          <Button variant="primary" data-autofocus onClick={onClose}>
            Done
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Create project" dismissible={!isSubmitting}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {serverError && (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </div>
        )}
        <Field label="Project name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" data-autofocus placeholder="Observer Demo iOS" aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="Bundle ID" htmlFor="bundleId" error={errors.bundleId?.message} hint="Must match the bundle identifier of your iOS app.">
          <Input id="bundleId" placeholder="com.company.app" className="font-mono" aria-invalid={!!errors.bundleId} {...register("bundleId")} />
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create project"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
