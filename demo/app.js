import { $, esc, download } from "./common.mjs";
import {
  createState,
  remaining,
  reserve,
  cancel,
  setCapacity,
  capacityFor,
  occupiedSeats,
  seatLabels,
  priceFor,
  occupancy,
} from "./engine.mjs";
const nextDay = new Date();
nextDay.setDate(nextDay.getDate() + 1);
const dateText = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
let state = createState(),
  tab = "search",
  trip = {
    from: "Chicago",
    to: "New York",
    date: dateText(nextDay),
    passengers: 2,
    cabin: "Economy",
  },
  selectedFlight = null,
  selectedSeats = [];
let timer;
function say(message) {
  clearTimeout(timer);
  $("#status").textContent = message;
  timer = setTimeout(() => ($("#status").textContent = ""), 7000);
}
const option = (value, current) =>
  `<option ${value === current ? "selected" : ""}>${esc(value)}</option>`;
function title(kicker, heading, description) {
  return `<div class="page-title"><span class="eyebrow">${kicker}</span><h1 id="view-title" tabindex="-1">${heading}</h1><p>${description}</p></div>`;
}
function routeArt() {
  return `<div class="route-art" aria-hidden="true"><div class="stamp">A LITTLE WANDER.<br>A LOT OF POSSIBILITY.</div><svg viewBox="0 0 500 260"><path class="route-path" d="M55 200 Q200 -10 445 72"/><circle cx="55" cy="200" r="8"/><circle cx="445" cy="72" r="8"/><text x="40" y="235">${trip.from === "Chicago" ? "CHI" : trip.from === "New York" ? "NYC" : "LON"}</text><text x="414" y="110">${trip.to === "Chicago" ? "CHI" : trip.to === "New York" ? "NYC" : "LON"}</text><g class="plane"><text x="247" y="76">✈</text></g></svg><div class="art-tag">✦ Your next chapter starts here</div></div>`;
}
function searchView() {
  const flights = state.flights.filter(
    (f) => f.from === trip.from && f.to === trip.to,
  );
  return `<section><div class="hero"><div><span class="eyebrow">THE FLIGHT EXPERIENCE, REIMAGINED</span><h1 id="view-title" tabindex="-1">Somewhere new.<br><em>Something possible.</em></h1><p>Pick a route. Find your seat. See how a small choice changes the bigger picture.</p><div class="hero-pills"><span>✦ Interactive seat map</span><span>↔ Traveler + operations views</span></div></div>${routeArt()}</div>
  <div class="truth"><span>✈ <strong>A flight product lab, not an airline.</strong> Fictional schedules and fares. No payment, passenger details, or real tickets.</span><button data-action="about">How it works ↗</button></div>
  <form id="search-form" class="search-panel"><label>From<select name="from">${["Chicago", "New York", "London"].map((x) => option(x, trip.from)).join("")}</select></label><button type="button" data-action="swap" class="swap" aria-label="Swap origin and destination">⇄</button><label>To<select name="to">${["New York", "Chicago", "London"].map((x) => option(x, trip.to)).join("")}</select></label><label>Illustrative date<input type="date" name="date" value="${trip.date}" required></label><label>Travelers<select name="passengers">${[1, 2, 3, 4].map((x) => option(x, trip.passengers)).join("")}</select></label><label>Fare concept<select name="cabin">${["Economy", "Business"].map((x) => option(x, trip.cabin)).join("")}</select></label><button class="primary" type="submit">Find my flight →</button></form>
  <div class="section-head"><div><span class="eyebrow">YOUR ROUTE / ${esc(trip.date)}</span><h2>${esc(trip.from)} <span class="arrow">→</span> ${esc(trip.to)}</h2></div><span class="muted">${flights.length} illustrative departures · ${trip.passengers} traveler${trip.passengers === 1 ? "" : "s"}</span></div>
  <div class="booking-layout"><div class="flights">${flights.map((f) => `<article class="flight-card ${selectedFlight === f.id ? "active" : ""}"><div class="flight-top"><span class="pill">BOARDING LAB · ${f.id}</span><span>${remaining(state, f.id, trip.date)} of ${capacityFor(state, f.id, trip.date)} seats available</span></div><div class="flight-body"><div><strong>${f.time}</strong><span>${f.fromCode}</span></div><div class="flight-line"><small>${f.duration}</small><div>· · · · · ✈ · · · · ·</div><small>Nonstop concept</small></div><div class="destination"><strong>${f.toCode}</strong><span>${esc(f.to)}</span></div><div class="fare"><strong>$${priceFor(f, trip.passengers, trip.cabin)}</strong><span>total for ${trip.passengers}</span></div></div><div class="flight-bottom"><span>${esc(trip.cabin)} · fictional fare · no checkout</span><button class="${selectedFlight === f.id ? "secondary" : "primary"}" data-flight="${f.id}" ${remaining(state, f.id, trip.date) < trip.passengers ? "disabled" : ""}>${selectedFlight === f.id ? "Selecting seats" : remaining(state, f.id, trip.date) < trip.passengers ? "Not enough seats" : "Choose seats →"}</button></div></article>`).join("") || `<div class="empty"><span>☁</span><h2>No flight in this small route library.</h2><p>Try Chicago → New York, Chicago → London, or New York → Chicago.</p><button class="secondary" data-action="example-route">Use Chicago → New York</button></div>`}<div class="note"><span>💡</span><p><strong>A small product detail matters.</strong><br>Seats belong to a flight <em>and a date</em>. Booking tomorrow does not consume next week’s inventory.</p></div></div><aside id="seat-panel">${seatPanel()}</aside></div></section>`;
}
function seatPanel() {
  if (!selectedFlight)
    return `<div class="seat-placeholder"><span>↗</span><h2>Your window to<br>somewhere new.</h2><p>Choose a flight to open its cabin.<br>Select ${trip.passengers} seat${trip.passengers === 1 ? "" : "s"}, then review your practice reservation.</p><div class="mini-seats" aria-hidden="true">${Array.from({ length: 12 }, () => "<i></i>").join("")}</div><span class="small-label">NO ACCOUNT. NO CHECKOUT.</span></div>`;
  const f = state.flights.find((f) => f.id === selectedFlight),
    capacity = capacityFor(state, f.id, trip.date),
    taken = new Set(occupiedSeats(state, f.id, trip.date)),
    labels = seatLabels(capacity);
  return `<div class="seat-card"><div class="section-head"><div><span class="eyebrow">${f.id} / ${trip.date}</span><h2 id="seat-title" tabindex="-1">Make yourself at home.</h2></div><button class="close" data-action="close-seats" aria-label="Close seat map">✕</button></div><p class="muted">Select ${trip.passengers} seat${trip.passengers === 1 ? "" : "s"}. Fare concept does not change this small cabin layout.</p><div class="seat-legend"><span><i></i>Available</span><span><i class="chosen"></i>Selected</span><span><i class="taken"></i>Reserved</span></div><div class="cabin"><span class="nose" aria-hidden="true">↑ FRONT OF CABIN</span><div class="seat-rows">${
    Array.from(
      { length: Math.ceil(capacity / 6) },
      (_, row) =>
        `<div class="seat-row">${["A", "B", "C", "aisle", "D", "E", "F"]
          .map((letter) => {
            if (letter === "aisle")
              return `<span class="row-label">${row + 1}</span>`;
            const seat = row + 1 + letter;
            if (!labels.includes(seat)) return "<span></span>";
            const booked = taken.has(seat),
              chosen = selectedSeats.includes(seat);
            return `<button class="seat ${booked ? "taken" : chosen ? "chosen" : ""}" data-seat="${seat}" aria-pressed="${chosen}" aria-label="Seat ${seat}, ${booked ? "reserved" : chosen ? "selected" : "available"}" ${booked ? "disabled" : ""}>${seat}</button>`;
          })
          .join("")}</div>`,
    ).join("") || "<p>No seats released for this departure.</p>"
  }</div></div><div class="selection-summary"><span><strong>${selectedSeats.length} / ${trip.passengers}</strong> selected</span><span>${selectedSeats.length ? selectedSeats.join(", ") : "Choose your seats above"}</span></div><div class="total"><span>Illustrative total</span><strong>$${priceFor(f, trip.passengers, trip.cabin)}</strong></div><button class="primary wide" data-action="reserve" ${selectedSeats.length !== trip.passengers ? "disabled" : ""}>Create practice reservation →</button><p class="fine">No money collected. No ticket issued. Selections are not held until you confirm in this browser session.</p></div>`;
}
function bookingsView() {
  return `<section>${title("02 / YOUR PRACTICE TRIPS", "A plan worth looking forward to.", "Reservations live only in this browser session. Download a summary, cancel a practice trip, or see its effect in Control tower.")}<div class="trip-grid">${
    state.bookings
      .map((b) => {
        const f = state.flights.find((f) => f.id === b.flight);
        return `<article class="boarding-pass ${b.cancelled ? "cancelled" : ""}"><div class="pass-top"><span>✈ BOARDING LAB</span><span>${b.cancelled ? "CANCELLED" : "PRACTICE RESERVATION"}</span></div><div class="pass-route"><div><strong>${f.fromCode}</strong><span>${f.from}</span></div><span>✈</span><div><strong>${f.toCode}</strong><span>${f.to}</span></div></div><div class="pass-facts"><div><span>DEPARTURE</span><strong>${b.date}<br>${f.time} illustrative</strong></div><div><span>FLIGHT / SEATS</span><strong>${f.id}<br>${b.seats.join(", ")}</strong></div><div><span>FARE / TRAVELERS</span><strong>${b.cabin}<br>${b.passengers} traveler${b.passengers === 1 ? "" : "s"}</strong></div></div><div class="pass-stub"><div><span class="eyebrow">${b.id} · NOT VALID FOR TRAVEL</span><strong>$${b.total} illustrative total</strong></div><div class="barcode" aria-hidden="true"></div></div><div class="pass-actions">${!b.cancelled ? `<button data-cancel="${b.id}" class="text-button">Cancel practice trip</button>` : "<span>Seats returned to this departure.</span>"}<button class="secondary" data-export="${b.id}">Download summary ↓</button></div></article>`;
      })
      .join("") ||
    `<div class="empty"><span>✈</span><h2>Your next chapter is unwritten.</h2><p>Choose a flight and select your seats to create a practice trip.</p><button class="primary" data-tab="search">Plan a trip →</button></div>`
  }</div><div class="note"><span>↔</span><p><strong>The other side of the experience.</strong><br><button class="text-button" data-tab="ops">Open Control tower</button> to inspect date-specific inventory and the session event history.</p></div></section>`;
}
function opsView() {
  const rows = occupancy(state, trip.date),
    booked = rows.reduce((s, r) => s + r.booked, 0),
    cap = rows.reduce((s, r) => s + r.capacity, 0);
  return `<section>${title("03 / CONTROL TOWER", "Every seat has a story.", "See the operational effect of each practice reservation. Change released capacity for one departure date, without removing seats already assigned.")}<div class="ops-toolbar"><label>Departure date<input id="ops-date" type="date" value="${trip.date}" required></label><button class="secondary" data-action="export-ops">Export operations snapshot ↓</button><span>Session simulation · not a secured admin system</span></div><div class="stats"><div><span>Released seats</span><strong>${cap}</strong><small>Across ${rows.length} fictional departures</small></div><div><span>Reserved seats</span><strong>${booked}</strong><small>Active practice reservations on this date</small></div><div><span>Occupancy</span><strong>${cap ? ((100 * booked) / cap).toFixed(1) + "%" : "N/A"}</strong><small>${cap ? "Reserved ÷ released capacity" : "No capacity released"}</small></div></div><div class="ops-layout"><div class="panel"><div class="section-head"><h2>The capacity picture</h2><span class="pill">${trip.date}</span></div><p class="muted">Purple = reserved. Pale = available. Exact counts appear beside each bar.</p><div class="occupancy-chart">${rows.map((r) => `<div class="occupancy-row"><div><strong>${r.id}</strong><span>${r.route}</span></div><div class="occupancy-track" role="img" aria-label="${r.id}: ${r.booked} reserved, ${r.available} available of ${r.capacity}"><span style="width:${r.capacity ? (100 * r.booked) / r.capacity : 0}%"></span></div><strong>${r.booked} / ${r.capacity}</strong></div>`).join("")}</div><h3>Release or remove unassigned capacity</h3><p class="fine">Seat labels are sequential (1A to 6F). Reducing capacity removes seats from the end of the layout. Assigned seats are protected, not just the total booking count.</p>${rows.map((r) => `<form class="capacity-form" data-id="${r.id}"><label>${r.id}<input aria-label="Released seats for ${r.id}" type="number" min="0" max="36" step="1" value="${r.capacity}" required name="capacity"></label><button class="secondary" type="submit">Apply ${r.id}</button><span>${r.available} available</span></form>`).join("")}</div><aside class="panel event-panel"><span class="eyebrow">SESSION EVENT HISTORY</span><h2>A decision leaves a trace.</h2><p class="muted">Newest first. All dates included. Resets on reload.</p>${
    state.events.length
      ? `<ol class="events">${state.events
          .slice()
          .reverse()
          .map(
            (e) =>
              `<li><strong>${e.action}</strong><span>${e.flight} · ${e.date}</span><small>${e.booking ? `${e.booking} · seats ${e.seats.join(", ")}` : `Released capacity: ${e.capacity}`}</small></li>`,
          )
          .join("")}</ol>`
      : '<div class="empty small"><span>◎</span><p>No session events yet. Make a practice reservation or change capacity to see the story unfold.</p></div>'
  }<div class="note"><p><strong>Production is a different problem.</strong><br>This browser cannot prevent conflicts with another customer. Real booking needs server-side transactions, seat-hold expiry, and idempotency.</p></div></aside></div></section>`;
}
function render(focus = false) {
  $("#app").innerHTML = {
    search: searchView,
    bookings: bookingsView,
    ops: opsView,
  }[tab]();
  document.querySelectorAll("header [data-tab]").forEach((b) => {
    if (b.dataset.tab === tab) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  $("#trip-count").textContent = state.bookings.filter(
    (b) => !b.cancelled,
  ).length;
  if (focus) $("#view-title")?.focus();
}
document.addEventListener("submit", (event) => {
  if (!event.target.matches("#search-form,.capacity-form")) return;
  event.preventDefault();
  try {
    const form = event.target,
      data = new FormData(form);
    if (form.id === "search-form") {
      const next = {
        from: data.get("from"),
        to: data.get("to"),
        date: data.get("date"),
        passengers: Number(data.get("passengers")),
        cabin: data.get("cabin"),
      };
      if (next.from === next.to)
        throw Error("Choose different departure and arrival cities.");
      capacityFor(state, "F101", next.date);
      trip = next;
      selectedFlight = null;
      selectedSeats = [];
      render();
      say("Route updated. Choose a departure to see its seats.");
    } else {
      setCapacity(
        state,
        form.dataset.id,
        trip.date,
        Number(data.get("capacity")),
      );
      render();
      say(
        "Released capacity updated for " +
          trip.date +
          ". Assigned seats are protected.",
      );
    }
  } catch (error) {
    say(error.message);
  }
});
document.addEventListener("click", (event) => {
  const b = event.target.closest("button");
  if (!b) return;
  try {
    if (b.dataset.tab) {
      tab = b.dataset.tab;
      render(true);
      return;
    }
    if (b.dataset.flight) {
      selectedFlight = b.dataset.flight;
      selectedSeats = [];
      render();
      $("#seat-title").focus();
      return;
    }
    if (b.dataset.seat) {
      const seat = b.dataset.seat;
      if (selectedSeats.includes(seat))
        selectedSeats = selectedSeats.filter((s) => s !== seat);
      else {
        if (selectedSeats.length >= trip.passengers) {
          say(
            `You already selected ${trip.passengers}. Deselect one to change it.`,
          );
          return;
        }
        selectedSeats.push(seat);
      }
      $("#seat-panel").innerHTML = seatPanel();
      document.querySelector(`[data-seat="${seat}"]`)?.focus();
      say(`${selectedSeats.length} of ${trip.passengers} seats selected.`);
      return;
    }
    if (b.dataset.cancel) {
      cancel(state, b.dataset.cancel);
      render();
      say(
        "Practice trip cancelled. Its exact seats are available again on that date.",
      );
      return;
    }
    if (b.dataset.export) {
      const booking = state.bookings.find((x) => x.id === b.dataset.export);
      download("boarding-lab-" + booking.id + ".json", {
        ...booking,
        disclaimer:
          "Fictional practice reservation. Not valid for travel. No ticket or payment.",
        flightDetails: state.flights.find((f) => f.id === booking.flight),
      });
      say("Practice summary downloaded. It is not a travel document.");
      return;
    }
    const a = b.dataset.action;
    if (a === "reserve") {
      const booking = reserve(
        state,
        selectedFlight,
        trip.passengers,
        trip.cabin,
        trip.date,
        selectedSeats,
      );
      selectedFlight = null;
      selectedSeats = [];
      tab = "bookings";
      render(true);
      say(booking.id + " created locally. No ticket issued.");
    }
    if (a === "close-seats") {
      const previousFlight = selectedFlight;
      selectedFlight = null;
      selectedSeats = [];
      render();
      document.querySelector(`[data-flight="${previousFlight}"]`)?.focus();
    }
    if (a === "swap") {
      const form = $("#search-form");
      const from = form.elements.from.value;
      form.elements.from.value = form.elements.to.value;
      form.elements.to.value = from;
      say("Origin and destination swapped. Search to apply.");
    }
    if (a === "example-route") {
      trip.from = "Chicago";
      trip.to = "New York";
      selectedFlight = null;
      selectedSeats = [];
      render();
    }
    if (a === "export-ops") {
      download("boarding-lab-operations.json", {
        simulation: true,
        date: trip.date,
        occupancy: occupancy(state, trip.date),
        events: state.events,
        limitations: [
          "Fictional schedules and capacity.",
          "Single browser session, no live inventory.",
          "No passenger data, payment, or real tickets.",
        ],
      });
      say("Operations snapshot exported.");
    }
    if (a === "about" || b.id === "about") $("#dialog").showModal();
    if (b.id === "close-dialog") $("#dialog").close();
    if (b.id === "motion") {
      const paused = document.documentElement.dataset.motion !== "off";
      document.documentElement.dataset.motion = paused ? "off" : "on";
      b.textContent = paused ? "Resume motion" : "Pause motion";
      b.setAttribute("aria-pressed", String(paused));
    }
    if (b.id === "reset") {
      state = createState();
      selectedFlight = null;
      selectedSeats = [];
      tab = "search";
      render(true);
      say(
        "Practice reservations and capacity edits cleared. Fresh session ready.",
      );
    }
  } catch (error) {
    say(error.message);
  }
});
document.addEventListener("change", (event) => {
  if (event.target.id === "ops-date") {
    try {
      capacityFor(state, "F101", event.target.value);
      trip.date = event.target.value;
      selectedFlight = null;
      selectedSeats = [];
      render();
      $("#ops-date").focus();
      say("Showing departures for " + trip.date + ".");
    } catch (error) {
      say(error.message);
      event.target.value = trip.date;
    }
  }
});
try {
  render();
  document.documentElement.dataset.ready = "true";
  clearTimeout(window.bootTimer);
} catch (error) {
  window.bootFailure();
  console.error(error);
}
