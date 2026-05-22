import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase environment variables are not configured");
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

export async function GET(
  _request: Request,
  { params }: { params: { operatorId: string } }
) {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("operators")
      .select("business_name, created_at")
      .eq("id", params.operatorId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Operator not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
