import { createServiceClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import ClientRequestForm from "./ClientRequestForm";

interface Props {
  params: { operatorId: string };
}

async function getOperatorInfo(operatorId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("operators")
    .select("business_name")
    .eq("id", operatorId)
    .single();

  if (error || !data) return null;
  return data;
}

export default async function ClientRequestPage({ params }: Props) {
  const operator = await getOperatorInfo(params.operatorId);

  if (!operator) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-primary rounded-full text-sm font-medium mb-4">
            CambioKPI
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Solicitud de Cambio
          </h1>
          <p className="text-lg text-gray-500">
            {operator.business_name}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Completa el formulario y tu operador procesará tu solicitud
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Normalmente respondemos en menos de 10 minutos
          </div>
        </div>

        {/* Form Card */}
        <ClientRequestForm operatorId={params.operatorId} />

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Tus datos son seguros y solo serán compartidos con el operador de
          cambio. Powered by CambioKPI.
        </p>
      </div>
    </div>
  );
}
