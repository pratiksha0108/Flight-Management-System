import test from "node:test";
import assert from "node:assert/strict";
import {
  createState,
  validDate,
  seatLabels,
  capacityFor,
  occupiedSeats,
  remaining,
  priceFor,
  reserve,
  cancel,
  setCapacity,
  occupancy,
} from "./engine.mjs";
const date = "2026-10-03",
  other = "2026-10-04";
test("fresh sessions are isolated", () => {
  const a = createState(),
    b = createState();
  a.flights[0].capacity = 0;
  assert.equal(b.flights[0].capacity, 24);
});
test("calendar validation rejects impossible dates", () => {
  for (const d of [
    "2026-02-30",
    "2026-13-01",
    "hello",
    "2026-2-01",
    "2026-02-29",
  ])
    assert.equal(validDate(d), false);
  assert.equal(validDate("2028-02-29"), true);
});
test("seat labels preserve physical positions", () => {
  assert.deepEqual(seatLabels(8), [
    "1A",
    "1B",
    "1C",
    "1D",
    "1E",
    "1F",
    "2A",
    "2B",
  ]);
  assert.deepEqual(seatLabels(0), []);
});
test("reservation consumes selected seats on one departure", () => {
  const s = createState(),
    b = reserve(s, "F101", 2, "Economy", date, ["1A", "1B"]);
  assert.equal(remaining(s, "F101", date), 22);
  assert.deepEqual(occupiedSeats(s, "F101", date), ["1A", "1B"]);
  assert.equal(b.total, 290);
  assert.equal(b.ticketIssued, false);
});
test("same seat can be booked on another date or flight", () => {
  const s = createState();
  reserve(s, "F101", 1, "Economy", date, ["1A"]);
  assert.equal(remaining(s, "F101", other), 24);
  reserve(s, "F101", 1, "Economy", other, ["1A"]);
  reserve(s, "F102", 1, "Economy", date, ["1A"]);
  assert.equal(s.bookings.length, 3);
});
test("double booking is rejected without mutating state", () => {
  const s = createState();
  reserve(s, "F101", 1, "Economy", date, ["1A"]);
  assert.throws(() => reserve(s, "F101", 1, "Economy", date, ["1A"]));
  assert.equal(s.bookings.length, 1);
  assert.equal(s.sequence, 2);
});
test("duplicate selections and wrong group counts are rejected", () => {
  const s = createState();
  assert.throws(() => reserve(s, "F101", 2, "Economy", date, ["1A", "1A"]));
  assert.throws(() => reserve(s, "F101", 2, "Economy", date, ["1A"]));
  assert.throws(() => reserve(s, "F101", 1.5, "Economy", date, ["1A"]));
});
test("nonexistent seats and flights are rejected", () => {
  const s = createState();
  assert.throws(() => reserve(s, "F101", 1, "Economy", date, ["99A"]));
  assert.throws(() => reserve(s, "UNKNOWN", 1, "Economy", date, ["1A"]));
});
test("invalid calendar date cannot reserve a seat", () => {
  assert.throws(() =>
    reserve(createState(), "F101", 1, "Economy", "2026-02-30", ["1A"]),
  );
});
test("cancellation restores exact seats only once", () => {
  const s = createState(),
    b = reserve(s, "F101", 2, "Economy", date, ["2A", "2B"]);
  cancel(s, b.id);
  assert.equal(remaining(s, "F101", date), 24);
  assert.throws(() => cancel(s, b.id));
  assert.equal(s.events.length, 2);
});
test("capacity change is isolated by date", () => {
  const s = createState();
  setCapacity(s, "F101", date, 6);
  assert.equal(capacityFor(s, "F101", date), 6);
  assert.equal(capacityFor(s, "F101", other), 24);
});
test("capacity protects exact assigned seat, not just booking count", () => {
  const s = createState();
  reserve(s, "F101", 1, "Economy", date, ["4F"]);
  assert.throws(() => setCapacity(s, "F101", date, 23));
  assert.equal(capacityFor(s, "F101", date), 24);
});
test("after cancellation, capacity can remove the unassigned seat", () => {
  const s = createState(),
    b = reserve(s, "F101", 1, "Economy", date, ["4F"]);
  cancel(s, b.id);
  setCapacity(s, "F101", date, 6);
  assert.equal(remaining(s, "F101", date), 6);
});
test("zero capacity has no invalid occupancy percentage", () => {
  const s = createState();
  setCapacity(s, "F101", date, 0);
  const row = occupancy(s, date).find((x) => x.id === "F101");
  assert.equal(row.load, null);
  assert.equal(row.available, 0);
});
test("capacity accepts whole numbers only within safe bounds", () => {
  for (const n of [-1, 37, 1.5, NaN])
    assert.throws(() => setCapacity(createState(), "F101", date, n));
});
test("fare uses group size and illustrative cabin multiplier", () => {
  const f = createState().flights[0];
  assert.equal(priceFor(f, 2, "Business"), 522);
  assert.throws(() => priceFor(f, 0, "Economy"));
  assert.throws(() => priceFor(f, 1, "Unknown"));
});
test("occupancy reconciles counts after mixed events", () => {
  const s = createState(),
    a = reserve(s, "F101", 2, "Economy", date, ["1A", "1B"]);
  reserve(s, "F102", 1, "Economy", date, ["1C"]);
  cancel(s, a.id);
  for (const r of occupancy(s, date)) {
    assert.equal(r.booked + r.available, r.capacity);
    assert.ok(r.available >= 0);
  }
});
test("reservation keeps a copy of selected seats", () => {
  const s = createState(),
    seats = ["1A"],
    b = reserve(s, "F101", 1, "Economy", date, seats);
  seats.push("1B");
  assert.deepEqual(b.seats, ["1A"]);
});
