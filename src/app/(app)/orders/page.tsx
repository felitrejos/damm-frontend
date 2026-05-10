import { OrdersListPage } from "@/components/orders/OrdersListPage";
import type { OrderRow } from "@/components/orders/columns";
import {
  listCustomers,
  listMaterials,
  listMaterialTypes,
} from "@/lib/api/catalog";
import { listOrders } from "@/lib/api/orders";
import { getErrorMessage } from "@/lib/api/errors";

export default async function OrdersPage() {
  try {
    const [orders, customers, materials, types] = await Promise.all([
      listOrders(),
      listCustomers(),
      listMaterials(),
      listMaterialTypes(),
    ]);

    const customerById = new Map(customers.map((c) => [c.id, c]));
    const materialById = new Map(materials.map((m) => [m.id, m]));
    const typeById = new Map(types.map((t) => [t.id, t]));

    const rows: OrderRow[] = orders.map((o) => {
      const material = materialById.get(o.material_id);
      const typeName = material?.material_type_id
        ? typeById.get(material.material_type_id)?.name ?? "—"
        : "—";
      return {
        id: o.id,
        customer_id: o.customer_id,
        customer_name: customerById.get(o.customer_id)?.name ?? "—",
        material_id: o.material_id,
        material_description: material?.description ?? "—",
        material_type: typeName,
        due_date: o.due_date ?? "",
        quantity: o.quantity,
        unit: o.sales_unit ?? material?.base_unit ?? "",
        delivered: !!o.delivered_flag,
      };
    });

    return <OrdersListPage rows={rows} />;
  } catch (error) {
    return <OrdersListPage rows={[]} initialError={getErrorMessage(error)} />;
  }
}
