import { NextResponse } from "next/server";
import { createSupabaseAuthServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createSupabaseAuthServerClient();
  await supabase.auth.signOut();

  return NextResponse.json({ signedOut: true });
}
