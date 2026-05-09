import type { Center } from "./columns";

// Placeholder data — backend endpoint `GET /api/v1/data/centers` not implemented yet.
// See wiki/contracts/api-contract.md and wiki/contracts/data-models.md (`Center` model).
export const sampleCenters: Center[] = [
  { id: 1, center: "Barcelona Norte", location: "Cataluña", routes: 14, admin: "Marta Ruiz" },
  { id: 2, center: "Barcelona Sur", location: "Cataluña", routes: 11, admin: "Jordi Vila" },
  { id: 3, center: "Tarragona", location: "Cataluña", routes: 7, admin: "Núria Soler" },
  { id: 4, center: "Lleida", location: "Cataluña", routes: 5, admin: "Pere Mas" },
  { id: 5, center: "Valencia", location: "Levante", routes: 12, admin: "Ana Pérez" },
  { id: 6, center: "Castellón", location: "Levante", routes: 6, admin: "Diego Torres" },
  { id: 7, center: "Murcia", location: "Levante", routes: 8, admin: "Lucía Sánchez" },
  { id: 8, center: "Madrid Norte", location: "Madrid", routes: 16, admin: "Pablo Gómez" },
  { id: 9, center: "Madrid Sur", location: "Madrid", routes: 13, admin: "Sara Martín" },
  { id: 10, center: "Sevilla", location: "Andalucía", routes: 10, admin: "Carlos Ortega" },
  { id: 11, center: "Málaga", location: "Andalucía", routes: 9, admin: "Eva Romero" },
  { id: 12, center: "Bilbao", location: "País Vasco", routes: 7, admin: "Ander Etxeberria" },
];
