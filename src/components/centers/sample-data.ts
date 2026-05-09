import type { Center } from "./columns";

// Placeholder data — backend endpoint `GET /api/v1/data/centers` not implemented yet.
// `lat`/`lng` mirror backend `Warehouse` (damm-backend/models/catalog.py:9). See
// wiki/contracts/api-contract.md and wiki/contracts/data-models.md (`Center`).
export const sampleCenters: Center[] = [
  { id: 1, center: "Barcelona Norte", location: "Cataluña", routes: 14, admin: "Marta Ruiz", lat: 41.4350, lng: 2.1820 },
  { id: 2, center: "Barcelona Sur", location: "Cataluña", routes: 11, admin: "Jordi Vila", lat: 41.3650, lng: 2.1400 },
  { id: 3, center: "Tarragona", location: "Cataluña", routes: 7, admin: "Núria Soler", lat: 41.1190, lng: 1.2450 },
  { id: 4, center: "Lleida", location: "Cataluña", routes: 5, admin: "Pere Mas", lat: 41.6175, lng: 0.6200 },
  { id: 5, center: "Valencia", location: "Levante", routes: 12, admin: "Ana Pérez", lat: 39.4700, lng: -0.3760 },
  { id: 6, center: "Castellón", location: "Levante", routes: 6, admin: "Diego Torres", lat: 39.9860, lng: -0.0510 },
  { id: 7, center: "Murcia", location: "Levante", routes: 8, admin: "Lucía Sánchez", lat: 37.9920, lng: -1.1300 },
  { id: 8, center: "Madrid Norte", location: "Madrid", routes: 16, admin: "Pablo Gómez", lat: 40.5100, lng: -3.7000 },
  { id: 9, center: "Madrid Sur", location: "Madrid", routes: 13, admin: "Sara Martín", lat: 40.3600, lng: -3.7000 },
  { id: 10, center: "Sevilla", location: "Andalucía", routes: 10, admin: "Carlos Ortega", lat: 37.3890, lng: -5.9840 },
  { id: 11, center: "Málaga", location: "Andalucía", routes: 9, admin: "Eva Romero", lat: 36.7210, lng: -4.4210 },
  { id: 12, center: "Bilbao", location: "País Vasco", routes: 7, admin: "Ander Etxeberria", lat: 43.2630, lng: -2.9350 },
];
