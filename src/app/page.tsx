"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-provider";

export default function Home() {
  const { ready, token } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (ready) router.replace(token ? "/dashboard" : "/login");
  }, [ready, token, router]);
  return null;
}
