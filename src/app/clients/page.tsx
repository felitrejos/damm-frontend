import { ClientsListPage } from "@/components/clients/ClientsListPage";
import { listCustomers } from "@/lib/api/catalog";

export default async function ClientsPage() {
  const clients = await listCustomers();

  return <ClientsListPage initialClients={clients} />;
}
