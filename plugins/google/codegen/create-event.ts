export const createGoogleEventCodegenTemplate = `// Create Google Calendar Event
const event = await googleCalendar.createEvent({
  title: "{{title}}",
  start: "{{start}}",
  end: "{{end}}",
  description: "{{description}}",
});`;
