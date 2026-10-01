import { getSupabase } from "./supabase";
import { GarageExport } from "../types/inspection";

// One row per user in the `garages` table:
//   user_id uuid primary key (= auth.uid())
//   data    jsonb           (a GarageExport payload)
//   updated_at timestamptz
const TABLE = "garages";

export interface CloudGarage {
  data: GarageExport;
  updated_at: string;
}

/** Fetch the signed-in user's garage row, or null if none exists yet. */
export async function pullGarage(userId: string): Promise<CloudGarage | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from(TABLE)
    .select("data, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.warn("cloudSync.pull error:", error.message);
    return null;
  }
  if (!data) return null;
  return { data: data.data as GarageExport, updated_at: data.updated_at as string };
}

/** Upsert the signed-in user's garage row. Returns true on success. */
export async function pushGarage(
  userId: string,
  payload: GarageExport
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from(TABLE).upsert(
    {
      user_id: userId,
      data: payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) {
    console.warn("cloudSync.push error:", error.message);
    return false;
  }
  return true;
}

/** True if a GarageExport actually contains any vehicles. */
export function garageHasData(g?: GarageExport | null): boolean {
  return !!g && Array.isArray(g.vehicles) && g.vehicles.length > 0;
}
