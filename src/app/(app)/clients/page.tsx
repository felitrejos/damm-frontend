import { ClientsListPage } from "@/components/clients/ClientsListPage";
import { listCustomers } from "@/lib/api/catalog";
import { getErrorMessage } from "@/lib/api/errors";

export default async function ClientsPage() {
  try {
    const clients = await listCustomers();

    return <ClientsListPage initialClients={clients} />;
  } catch (error) {
    return (
      <ClientsListPage
        initialClients={[]}
        initialError={getErrorMessage(error)}
      />
    );
  }
}
