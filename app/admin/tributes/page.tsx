import { AdminPageHeader } from "@/components/admin/admin-ui";
import { TributesOperations } from "@/components/admin/TributesOperations";

export default function AdminTributesPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Homenagens"
        subtitle="Gestão operacional · paginação server-side"
      />
      <TributesOperations />
    </div>
  );
}
