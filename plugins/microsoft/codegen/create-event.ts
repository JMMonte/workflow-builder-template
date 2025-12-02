export const createMicrosoftEventCodegenTemplate = `// Create Outlook calendar event
const event = await outlookCalendar.createEvent({
  title: "{{title}}",
  start: "{{start}}",
  end: "{{end}}",
  description: "{{description}}",
});`;
