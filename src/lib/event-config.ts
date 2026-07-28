// CASO N.º 050899 — datos del expediente. Edita aquí fecha, lugar y el link de Kahoot.

export const CASE_NUMBER = "050899";
export const HONOREE_NAME = "JL";

// Hora local de Lima (America/Lima, UTC-5, sin horario de verano).
export const EVENT_DATE_ISO = "2026-08-05T20:00:00-05:00";
export const EVENT_DATE = new Date(EVENT_DATE_ISO);

export const EVENT_ADDRESS = "Av. Javier Prado Este 1320, San Isidro, Lima, Perú";
export const EVENT_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  EVENT_ADDRESS
)}`;

// Placeholder — reemplaza con el link/PIN real el día del evento.
export const KAHOOT_URL = "";

export const ADMIN_EMAIL = "joseluismunozzuta@gmail.com";
