export const seedFlights = [
  {
    id: "F101",
    from: "Chicago",
    to: "New York",
    fromCode: "CHI",
    toCode: "NYC",
    time: "09:10",
    duration: "2h 15m",
    price: 145,
    capacity: 24,
  },
  {
    id: "F102",
    from: "Chicago",
    to: "New York",
    fromCode: "CHI",
    toCode: "NYC",
    time: "15:40",
    duration: "2h 20m",
    price: 165,
    capacity: 18,
  },
  {
    id: "F201",
    from: "Chicago",
    to: "London",
    fromCode: "CHI",
    toCode: "LON",
    time: "18:30",
    duration: "7h 50m",
    price: 520,
    capacity: 24,
  },
  {
    id: "F301",
    from: "New York",
    to: "Chicago",
    fromCode: "NYC",
    toCode: "CHI",
    time: "11:00",
    duration: "2h 35m",
    price: 150,
    capacity: 24,
  },
];
export function createState() {
  return {
    flights: seedFlights.map((f) => ({ ...f })),
    bookings: [],
    capacities: {},
    sequence: 1,
    events: [],
  };
}
export function validDate(date) {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return false;
  const d = new Date(date + "T12:00:00Z");
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === date;
}
export function seatLabels(capacity) {
  return Array.from(
    { length: capacity },
    (_, i) => `${Math.floor(i / 6) + 1}${"ABCDEF"[i % 6]}`,
  );
}
export function capacityFor(state, id, date) {
  const f = state.flights.find((f) => f.id === id);
  if (!f || !validDate(date))
    throw Error("Choose a valid flight and calendar date.");
  return state.capacities[`${id}|${date}`] ?? f.capacity;
}
export function occupiedSeats(state, id, date) {
  capacityFor(state, id, date);
  return state.bookings
    .filter((b) => b.flight === id && b.date === date && !b.cancelled)
    .flatMap((b) => b.seats);
}
export function remaining(state, id, date) {
  return capacityFor(state, id, date) - occupiedSeats(state, id, date).length;
}
export function priceFor(flight, passengers, cabin) {
  if (
    !flight ||
    !Number.isInteger(passengers) ||
    passengers < 1 ||
    passengers > 4 ||
    !["Economy", "Business"].includes(cabin)
  )
    throw Error("Choose 1 to 4 travelers and a valid cabin.");
  return Math.round(
    flight.price * (cabin === "Business" ? 1.8 : 1) * passengers,
  );
}
export function reserve(state, id, passengers, cabin, date, seats) {
  const flight = state.flights.find((f) => f.id === id),
    total = priceFor(flight, passengers, cabin);
  const labels = seatLabels(capacityFor(state, id, date)),
    taken = new Set(occupiedSeats(state, id, date));
  if (
    !Array.isArray(seats) ||
    seats.length !== passengers ||
    new Set(seats).size !== seats.length
  )
    throw Error(
      `Select exactly ${passengers} different seat${passengers === 1 ? "" : "s"}.`,
    );
  if (seats.some((seat) => !labels.includes(seat) || taken.has(seat)))
    throw Error("A selected seat is unavailable. Choose another seat.");
  const booking = {
    id: "LAB-" + String(state.sequence++).padStart(3, "0"),
    flight: id,
    passengers,
    cabin,
    date,
    seats: [...seats],
    total,
    cancelled: false,
    simulation: true,
    ticketIssued: false,
  };
  state.bookings.push(booking);
  state.events.push({
    action: "Reserved",
    booking: booking.id,
    flight: id,
    date,
    seats: [...seats],
  });
  return booking;
}
export function cancel(state, id) {
  const b = state.bookings.find((b) => b.id === id);
  if (!b || b.cancelled) throw Error("This reservation is not active.");
  b.cancelled = true;
  state.events.push({
    action: "Cancelled",
    booking: id,
    flight: b.flight,
    date: b.date,
    seats: [...b.seats],
  });
}
export function setCapacity(state, id, date, capacity) {
  capacityFor(state, id, date);
  if (!Number.isInteger(capacity) || capacity < 0 || capacity > 36)
    throw Error("Capacity must be a whole number between 0 and 36.");
  const available = new Set(seatLabels(capacity));
  if (occupiedSeats(state, id, date).some((seat) => !available.has(seat)))
    throw Error(
      "That change would remove an assigned seat. Cancel its practice reservation first.",
    );
  state.capacities[`${id}|${date}`] = capacity;
  state.events.push({ action: "Capacity changed", flight: id, date, capacity });
}
export function occupancy(state, date) {
  return state.flights.map((f) => {
    const capacity = capacityFor(state, f.id, date),
      booked = occupiedSeats(state, f.id, date).length;
    return {
      id: f.id,
      route: `${f.from} → ${f.to}`,
      capacity,
      booked,
      available: capacity - booked,
      load: capacity ? booked / capacity : null,
    };
  });
}
