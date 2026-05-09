import type { Client } from "./columns";

// Placeholder data — backend endpoint not wired yet.
// Coords are approximate Barcelona neighborhood centers, grouped by zone.
export const sampleClients: Client[] = [
  { id: 1, code: "C-001", name: "Bar La Plaça", city: "Barcelona", zone: "Eixample", lat: 41.3870, lng: 2.1700 },
  { id: 2, code: "C-002", name: "Cerveseria Universitat", city: "Barcelona", zone: "Eixample", lat: 41.3860, lng: 2.1620 },
  { id: 3, code: "C-003", name: "Restaurant Diagonal", city: "Barcelona", zone: "Eixample", lat: 41.3940, lng: 2.1580 },
  { id: 4, code: "C-004", name: "Bodega Verdi", city: "Barcelona", zone: "Gràcia", lat: 41.4030, lng: 2.1570 },
  { id: 5, code: "C-005", name: "Bar Vila de Gràcia", city: "Barcelona", zone: "Gràcia", lat: 41.4010, lng: 2.1530 },
  { id: 6, code: "C-006", name: "Café Travessera", city: "Barcelona", zone: "Gràcia", lat: 41.3990, lng: 2.1580 },
  { id: 7, code: "C-007", name: "Bar Sants Estació", city: "Barcelona", zone: "Sants-Montjuïc", lat: 41.3790, lng: 2.1410 },
  { id: 8, code: "C-008", name: "Restaurant Hostafrancs", city: "Barcelona", zone: "Sants-Montjuïc", lat: 41.3760, lng: 2.1450 },
  { id: 9, code: "C-009", name: "Cerveseria Poble Sec", city: "Barcelona", zone: "Sants-Montjuïc", lat: 41.3750, lng: 2.1640 },
  { id: 10, code: "C-010", name: "Bar Poblenou", city: "Barcelona", zone: "Sant Martí", lat: 41.4040, lng: 2.2010 },
  { id: 11, code: "C-011", name: "Restaurant Rambla Poblenou", city: "Barcelona", zone: "Sant Martí", lat: 41.4050, lng: 2.1960 },
  { id: 12, code: "C-012", name: "Cafè Diagonal Mar", city: "Barcelona", zone: "Sant Martí", lat: 41.4090, lng: 2.2160 },
  { id: 13, code: "C-013", name: "Taberna Born", city: "Barcelona", zone: "Ciutat Vella", lat: 41.3850, lng: 2.1820 },
  { id: 14, code: "C-014", name: "Bar Gòtic", city: "Barcelona", zone: "Ciutat Vella", lat: 41.3820, lng: 2.1770 },
];
