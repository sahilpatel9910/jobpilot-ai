import { NextResponse } from "next/server";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/db/types";
import { createSupabaseServerClient, getCurrentUser, hasSupabaseServerConfig } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ application: null, persistence: "skipped" });
  }
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to view this application." }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("applications").select("*").eq("id", id).eq("user_id", user.id).single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ application: data, persistence: "saved" });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 400 });
  }
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to update this application." }, { status: 401 });
  }

  const body = (await request.json()) as { status?: string; note?: string };
  if (!body.status || !APPLICATION_STATUSES.includes(body.status as ApplicationStatus)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : null;

  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data: existing, error: existingError } = await supabase
    .from("applications")
    .select("status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("applications")
    .update({ status: body.status as ApplicationStatus })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (existing.status !== body.status) {
    await supabase.from("application_status_history").insert({
      application_id: id,
      from_status: existing.status,
      to_status: body.status as ApplicationStatus,
      note
    });
  }

  return NextResponse.json({ application: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 400 });
  }
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to delete this application." }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("applications").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
