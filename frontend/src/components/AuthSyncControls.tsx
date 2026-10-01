"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Check,
  X,
  LogOut,
  Mail,
} from "lucide-react";
import { getSupabase, isCloudConfigured } from "../lib/supabase";
import { pullGarage, pushGarage, garageHasData } from "../lib/cloudSync";
import { useInspectionStore } from "../store/useInspectionStore";

type SyncStatus = "idle" | "syncing" | "synced" | "error";

export const AuthSyncControls: React.FC = () => {
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [modalOpen, setModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  // Suppress the change-driven push while we are applying a pulled cloud garage.
  const applyingRemote = useRef(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Auth session wiring ---
  useEffect(() => {
    if (!isCloudConfigured) return;
    const sb = getSupabase();
    if (!sb) return;

    let unsub: (() => void) | undefined;

    const onSignedIn = async (userId: string, userEmail: string | null) => {
      setEmail(userEmail);
      setStatus("syncing");
      try {
        const cloud = await pullGarage(userId);
        const localExport = useInspectionStore.getState().exportGarage();
        if (cloud && garageHasData(cloud.data)) {
          // Cloud is the source of truth on sign-in.
          applyingRemote.current = true;
          useInspectionStore.getState().importGarage(cloud.data);
          applyingRemote.current = false;
        } else if (garageHasData(localExport)) {
          // First device with data — seed the cloud from local.
          await pushGarage(userId, localExport);
        }
        setStatus("synced");
      } catch {
        setStatus("error");
      }
    };

    sb.auth.getSession().then(({ data }) => {
      const s = data.session;
      if (s?.user) onSignedIn(s.user.id, s.user.email ?? null);
    });

    const { data: listener } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        onSignedIn(session.user.id, session.user.email ?? null);
      } else if (event === "SIGNED_OUT") {
        setEmail(null);
        setStatus("idle");
      }
    });
    unsub = () => listener.subscription.unsubscribe();

    return () => unsub?.();
  }, []);

  // --- Push local changes up (debounced) while signed in ---
  useEffect(() => {
    if (!isCloudConfigured) return;
    const sb = getSupabase();
    if (!sb) return;

    const unsubscribe = useInspectionStore.subscribe(() => {
      if (applyingRemote.current) return;
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(async () => {
        const { data } = await sb.auth.getSession();
        const userId = data.session?.user?.id;
        if (!userId) return;
        setStatus("syncing");
        const ok = await pushGarage(userId, useInspectionStore.getState().exportGarage());
        setStatus(ok ? "synced" : "error");
      }, 1500);
    });

    return () => {
      unsubscribe();
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, []);

  if (!isCloudConfigured) return null; // local-only build: no sync UI

  const signInEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb || !emailInput.trim()) return;
    setNotice(null);
    const { error } = await sb.auth.signInWithOtp({
      email: emailInput.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setNotice(
      error
        ? `Could not send link: ${error.message}`
        : "Check your email for a secure sign-in link."
    );
  };

  const signInGoogle = async () => {
    const sb = getSupabase();
    if (!sb) return;
    await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  const signOut = async () => {
    const sb = getSupabase();
    if (!sb) return;
    await sb.auth.signOut();
  };

  return (
    <>
      {email ? (
        <button
          onClick={() => setModalOpen(true)}
          className="h-8 px-2.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold flex items-center gap-1.5 transition"
          title={`Synced as ${email}`}
        >
          {status === "syncing" ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : status === "error" ? (
            <CloudOff className="w-3 h-3 text-amber-600" />
          ) : (
            <Cloud className="w-3 h-3" />
          )}
          <span className="hidden sm:inline">
            {status === "error" ? "Sync issue" : "Synced"}
          </span>
        </button>
      ) : (
        <button
          onClick={() => setModalOpen(true)}
          className="h-8 px-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-semibold flex items-center gap-1.5 transition"
        >
          <Cloud className="w-3 h-3 text-orange-500" />
          <span>Sync</span>
        </button>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-zinc-200/80 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-orange-500" />
                <h3 className="text-base font-bold text-zinc-900">
                  {email ? "Cloud Sync" : "Sync across devices"}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-400 hover:text-zinc-900 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {email ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-2 text-zinc-700">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>
                    Signed in as <strong>{email}</strong>. Your garage syncs
                    automatically on this and every signed-in device.
                  </span>
                </div>
                <button
                  onClick={() => {
                    signOut();
                    setModalOpen(false);
                  }}
                  className="w-full h-11 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs flex items-center justify-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out (keeps data on this device)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Sign in to save your garage to the cloud and open it with the
                  same data on any device.
                </p>
                <form onSubmit={signInEmail} className="space-y-2.5">
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                  <button
                    type="submit"
                    className="w-full h-11 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-99 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Email me a sign-in link</span>
                  </button>
                </form>
                <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                  <div className="flex-1 h-px bg-zinc-200" />
                  <span>or</span>
                  <div className="flex-1 h-px bg-zinc-200" />
                </div>
                <button
                  onClick={signInGoogle}
                  className="w-full h-11 rounded-2xl bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-800 font-semibold text-xs transition"
                >
                  Continue with Google
                </button>
                {notice && (
                  <div className="text-[11px] font-medium text-zinc-700 bg-zinc-50 border border-zinc-200/70 rounded-lg p-2">
                    {notice}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
