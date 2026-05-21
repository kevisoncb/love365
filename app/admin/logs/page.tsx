import { AdminPageHeader } from "@/components/admin/admin-ui";
import { LogsOperations } from "@/components/admin/LogsOperations";

export default function AdminLogsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Logs"
        subtitle="Webhooks, pagamentos, uploads e erros do app"
      />
      <LogsOperations />
    </div>
  );
}
