// Excel upload and template download features for admin.html.
const EVENTS_STORAGE_KEY = "utsavEvents";

const REQUIRED_COLUMNS = [
  "Event Name",
  "Category",
  "Description",
  "Venue",
  "Date",
  "Time",
  "Deadline",
  "Contact Name",
  "Contact Phone/Email"
];

let previewEvents = [];

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("excel-file");
  const saveButton = document.getElementById("save-events");
  const templateLink = document.getElementById("download-template");

  if (!fileInput || !saveButton || !templateLink) return;

  fileInput.addEventListener("change", handleFileSelection);
  saveButton.addEventListener("click", saveEvents);
  templateLink.addEventListener("click", downloadSampleTemplate);
  showSavedCount();
});

async function handleFileSelection(event) {
  const file = event.target.files[0];
  const message = document.getElementById("upload-message");
  const saveButton = document.getElementById("save-events");
  const previewArea = document.getElementById("preview-area");

  previewEvents = [];
  saveButton.disabled = true;
  previewArea.replaceChildren();
  message.classList.remove("error");

  if (!file) return;

  if (!window.XLSX) {
    showUploadError("The Excel library could not load. Check your internet connection and reload the page.");
    return;
  }

  if (!/\.(xlsx|xls)$/i.test(file.name)) {
    showUploadError("Please select an Excel workbook with an .xlsx or .xls extension.");
    return;
  }

  try {
    const fileData = await file.arrayBuffer();
    const workbook = XLSX.read(fileData, { type: "array", cellDates: true });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

    if (!firstSheet) {
      showUploadError("This workbook has no worksheet. Please choose a workbook with an event sheet.");
      return;
    }

    const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
    if (rows.length === 0) {
      showUploadError("The first worksheet is empty. Add event rows under the column headings.");
      return;
    }

    const headerError = checkHeaders(rows[0]);
    if (headerError) {
      showUploadError(headerError);
      return;
    }

    const result = makeEventList(rows);
    if (result.errors.length > 0) {
      showUploadError(result.errors.join(" "));
      return;
    }

    previewEvents = result.events;
    renderPreview(previewEvents);
    message.textContent = `Preview ready: ${previewEvents.length} event(s) found.`;
    saveButton.disabled = false;
  } catch (error) {
    showUploadError("We could not read this workbook. Make sure it is a valid Excel file with a worksheet.");
  }
}

function normalizeHeading(heading) {
  return String(heading).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function checkHeaders(firstRow) {
  const availableHeadings = Object.keys(firstRow).map(normalizeHeading);
  const missing = REQUIRED_COLUMNS.filter(
    (heading) => !availableHeadings.includes(normalizeHeading(heading))
  );

  if (missing.length > 0) {
    return `Missing or misspelled column heading(s): ${missing.join(", ")}. Please use the sample template.`;
  }
  return "";
}

function makeEventList(rows) {
  const events = [];
  const errors = [];

  rows.forEach((row, index) => {
    const normalizedRow = {};
    Object.entries(row).forEach(([heading, value]) => {
      normalizedRow[normalizeHeading(heading)] = value;
    });

    const event = {
      name: cleanValue(normalizedRow.eventname),
      category: cleanValue(normalizedRow.category),
      description: cleanValue(normalizedRow.description),
      venue: cleanValue(normalizedRow.venue),
      date: formatDate(normalizedRow.date),
      time: cleanValue(normalizedRow.time),
      deadline: formatDate(normalizedRow.deadline),
      contactName: cleanValue(normalizedRow.contactname),
      contactInfo: cleanValue(normalizedRow.contactphoneemail)
    };

    const isBlankRow = Object.values(event).every((value) => !value);
    if (isBlankRow) return;

    const rowNumber = index + 2;
    const missingFields = Object.entries(event)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      errors.push(`Row ${rowNumber} has empty required fields (${missingFields.join(", ")}).`);
      return;
    }

    if (!["Cultural", "Non-Cultural"].includes(event.category)) {
      errors.push(`Row ${rowNumber} category must be "Cultural" or "Non-Cultural".`);
      return;
    }

    events.push(event);
  });

  if (events.length === 0 && errors.length === 0) {
    errors.push("No event rows were found. Add at least one complete event.");
  }

  return { events, errors };
}

function cleanValue(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function formatDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toLocaleDateString("en-GB");
  }
  return cleanValue(value);
}

function renderPreview(events) {
  const previewArea = document.getElementById("preview-area");
  const table = document.createElement("table");
  const head = document.createElement("thead");
  const headerRow = document.createElement("tr");

  ["Event Name", "Category", "Date", "Venue", "Contact"].forEach((heading) => {
    const cell = document.createElement("th");
    cell.textContent = heading;
    headerRow.appendChild(cell);
  });

  head.appendChild(headerRow);
  table.appendChild(head);

  const body = document.createElement("tbody");
  events.forEach((event) => {
    const row = document.createElement("tr");
    [event.name, event.category, event.date, event.venue, event.contactInfo]
      .forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });
    body.appendChild(row);
  });

  table.appendChild(body);
  previewArea.replaceChildren(table);
}

function saveEvents() {
  if (previewEvents.length === 0) return;

  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(previewEvents));
    const message = document.getElementById("upload-message");
    message.classList.remove("error");
    message.textContent = `${previewEvents.length} event(s) saved in this browser. Open the Events page to view them.`;
    showSavedCount();
  } catch (error) {
    showUploadError("The browser could not save the events. Check whether local storage is available.");
  }
}

function showSavedCount() {
  try {
    const savedEvents = JSON.parse(localStorage.getItem(EVENTS_STORAGE_KEY)) || [];
    const message = document.getElementById("upload-message");
    if (savedEvents.length > 0 && !message.textContent) {
      message.textContent = `${savedEvents.length} event(s) are currently saved in this browser.`;
    }
  } catch (error) {
    // The upload page can still be used to replace unreadable stored data.
  }
}

function showUploadError(text) {
  const message = document.getElementById("upload-message");
  message.textContent = text;
  message.classList.add("error");
}

function downloadSampleTemplate(event) {
  event.preventDefault();

  if (!window.XLSX) {
    showUploadError("The Excel library could not load. Check your internet connection and reload the page.");
    return;
  }

  const sampleRows = [
    ["Event Name", "Category", "Description", "Venue", "Date", "Time", "Deadline", "Contact Name", "Contact Phone/Email"],
    ["Battle of the Bands", "Cultural", "A live music contest for student bands.", "Open Air Stage", "2026-12-10", "5:00 PM", "2026-12-05", "Aarav Mehta", "aarav@example.edu"],
    ["Street Dance", "Cultural", "Show your best moves in a group dance battle.", "Central Quad", "2026-12-11", "3:00 PM", "2026-12-06", "Maya Singh", "555-0101"],
    ["Campus Photography", "Cultural", "Capture the spirit of campus in one photograph.", "Art Studio", "2026-12-10", "11:00 AM", "2026-12-07", "Noah Patel", "noah@example.edu"],
    ["Drama Showcase", "Cultural", "Short student-written plays performed live.", "Main Auditorium", "2026-12-12", "6:30 PM", "2026-12-08", "Ira Das", "555-0102"],
    ["Quiz Quest", "Non-Cultural", "A friendly team quiz covering science and pop culture.", "Room B204", "2026-12-10", "1:00 PM", "2026-12-08", "Riya Shah", "riya@example.edu"],
    ["Robo Rally", "Non-Cultural", "Build and race a small robot through an obstacle course.", "Innovation Lab", "2026-12-11", "10:00 AM", "2026-12-07", "Kabir Rao", "555-0103"],
    ["Chess Blitz", "Non-Cultural", "Fast-paced chess rounds for players of all levels.", "Library Hall", "2026-12-12", "12:00 PM", "2026-12-09", "Zoya Khan", "zoya@example.edu"],
    ["Startup Sprint", "Non-Cultural", "Pitch a practical idea to a panel of student judges.", "Seminar Room 1", "2026-12-11", "2:00 PM", "2026-12-06", "Dev Nair", "555-0104"],
    ["T-shirt Design", "Cultural", "Create an original design inspired by the fest.", "Design Lab", "2026-12-12", "9:30 AM", "2026-12-08", "Anya Bose", "anya@example.edu"]
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sampleRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Events");
  XLSX.writeFile(workbook, "utsav-event-template.xlsx");
}