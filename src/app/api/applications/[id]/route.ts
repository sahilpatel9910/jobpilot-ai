import { NextResponse } from "next/server";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/db/types";
import { createSupabaseServerClient, hasSupabaseServerConfig } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ application: null, persistence: "skipped" });
  }

  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("applications").select("*").eq("id", id).single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ application: data, persistence: "saved" });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 400 });
  }

  const body = (await request.json()) as { status?: string };
  if (!body.status || !APPLICATION_STATUSES.includes(body.status as ApplicationStatus)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("applications")
    .update({ status: body.status as ApplicationStatus })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ application: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 400 });
  }

  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("applications").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
