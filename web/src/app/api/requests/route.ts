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

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();

    const body = await request.json();
    const {
      operator_id,
      client_name,
      client_contact,
      amount_in,
      currency_in,
      currency_out,
      payment_method,
      wallet_address,
      notes,
    } = body;

    // Validation
    if (!operator_id) {
      return NextResponse.json(
        { error: "operator_id is required" },
        { status: 400 }
      );
    }
    if (!amount_in || amount_in <= 0) {
      return NextResponse.json(
        { error: "amount_in must be a positive number" },
        { status: 400 }
      );
    }
    if (!currency_in) {
      return NextResponse.json(
        { error: "currency_in is required" },
        { status: 400 }
      );
    }
    if (!payment_method) {
      return NextResponse.json(
        { error: "payment_method is required" },
        { status: 400 }
      );
    }

    // Verify operator exists
    const { data: operator } = await supabase
      .from("operators")
      .select("id")
      .eq("id", operator_id)
      .single();

    if (!operator) {
      return NextResponse.json(
        { error: "Operator not found" },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("client_requests")
      .insert({
        operator_id,
        client_name: client_name || null,
        client_contact: client_contact || null,
        amount_in,
        currency_in,
        currency_out: currency_out || "USDT",
        payment_method,
        wallet_address: wallet_address || null,
        notes: notes || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json(
        { error: "Failed to create request", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data.id }, { status: 201 });
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
