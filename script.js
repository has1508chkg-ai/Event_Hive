// Shared JavaScript for the public pages.
// Events are stored as JSON under this key in the browser's localStorage.
const STORAGE_KEY = "utsavEvents";

document.addEventListener("DOMContentLoaded", () => {
  showCurrentYear();
  setupEventFilters();
  setupRegistrationForm();
  setupRandomEvent();
  setupContactForm();
});

function showCurrentYear() {
  const year = document.getElementById("current-year");
  if (year) {
    year.textContent = new Date().getFullYear();
  }
}

function getSavedEvents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function setupEventFilters() {
  const list = document.getElementById("events-list");
  if (!list) return;

  const filterButtons = document.querySelectorAll(".filter-button");
  const events = getSavedEvents();

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");
      renderEvents(events, button.dataset.category);
    });
  });

  renderEvents(events, "all");
}

function renderEvents(events, category) {
  const list = document.getElementById("events-list");
  const message = document.getElementById("event-message");
  if (!list || !message) return;

  list.replaceChildren();
  const matchingEvents = category === "all"
    ? events
    : events.filter((event) => event.category === category);

  if (matchingEvents.length === 0) {
    message.textContent = events.length
      ? "There are no events in this category."
      : "No events have been uploaded yet. Visit Admin / Upload to add an Excel event list.";
    return;
  }

  message.textContent = "";
  matchingEvents.forEach((event) => list.appendChild(createEventCard(event)));
}

function createEventCard(event) {
  const card = document.createElement("article");
  card.className = "event-card";

  const badge = document.createElement("span");
  badge.className = "event-category";
  badge.textContent = event.category;

  const title = document.createElement("h2");
  title.textContent = event.name;

  const description = document.createElement("p");
  description.textContent = event.description;

  const details = document.createElement("div");
  details.className = "event-details";

  const rows = [
    ["Venue", event.venue],
    ["Date", event.date],
    ["Time", event.time],
    ["Deadline", event.deadline],
    ["Contact", event.contactName],
    ["Phone / Email", event.contactInfo]
  ];

  rows.forEach(([label, value]) => {
    const item = document.createElement("div");
    const strong = document.createElement("strong");
    strong.textContent = `${label}: `;
    item.append(strong, document.createTextNode(value || "Not provided"));
    details.appendChild(item);
  });

  const registerButton = document.createElement("button");
  registerButton.className = "button button-primary";
  registerButton.type = "button";
  registerButton.textContent = "Register";
  registerButton.addEventListener("click", () => openRegistrationForm(event.name));

  card.append(badge, title, description, details, registerButton);
  return card;
}

function setupRegistrationForm() {
  const form = document.getElementById("registration-form");
  const dialog = document.getElementById("registration-dialog");
  const closeButton = document.getElementById("close-registration");
  if (!form || !dialog) return;

  if (closeButton) {
    closeButton.addEventListener("click", () => dialog.close());
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = document.getElementById("registration-message");

    if (!form.checkValidity()) {
      form.reportValidity();
      message.textContent = "Please complete every field with valid information.";
      message.classList.add("error");
      return;
    }

    message.classList.remove("error");
    message.textContent = "Thanks! Your form passed validation. This demo does not submit it to a server.";
    form.reset();
  });
}

function openRegistrationForm(eventName) {
  const dialog = document.getElementById("registration-dialog");
  const select = document.getElementById("register-event");
  if (!dialog || !select) return;

  const events = getSavedEvents();
  select.replaceChildren();

  events.forEach((event) => {
    const option = document.createElement("option");
    option.value = event.name;
    option.textContent = event.name;
    select.appendChild(option);
  });

  select.value = eventName;

  const message = document.getElementById("registration-message");
  if (message) {
    message.textContent = "";
    message.classList.remove("error");
  }

  dialog.showModal();
}

function setupRandomEvent() {
  const button = document.getElementById("random-button");
  const result = document.getElementById("random-result");
  if (!button || !result) return;

  button.addEventListener("click", () => {
    const events = getSavedEvents();

    if (events.length === 0) {
      result.textContent = "No events are available yet. Upload an Excel event list on the Admin / Upload page.";
      return;
    }

    const randomIndex = Math.floor(Math.random() * events.length);
    result.replaceChildren(createRandomCard(events[randomIndex]));
  });
}

function createRandomCard(event) {
  const card = document.createElement("article");
  card.className = "random-card";

  const badge = document.createElement("span");
  badge.className = "event-category";
  badge.textContent = event.category;

  const title = document.createElement("h2");
  title.textContent = event.name;

  const description = document.createElement("p");
  description.textContent = event.description;

  const details = document.createElement("div");
  details.className = "event-details";
  [
    ["Venue", event.venue],
    ["Date", event.date],
    ["Time", event.time],
    ["Deadline", event.deadline],
    ["Contact", event.contactName],
    ["Phone / Email", event.contactInfo]
  ].forEach(([label, value]) => {
    const item = document.createElement("div");
    const strong = document.createElement("strong");
    strong.textContent = `${label}: `;
    item.append(strong, document.createTextNode(value || "Not provided"));
    details.appendChild(item);
  });

  const link = document.createElement("a");
  link.className = "button button-primary";
  link.href = "events.html";
  link.textContent = "Go to events to register";

  card.append(badge, title, description, details, link);
  return card;
}

function setupContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    const errorMessage = document.getElementById("contact-error");

    if (!form.checkValidity()) {
      event.preventDefault();
      errorMessage.textContent = "Please enter your name, a valid email address, and a message.";
      form.reportValidity();
      return;
    }

    errorMessage.textContent = "";
    // The form's action attribute sends the browser to thankyou.html.
  });
}