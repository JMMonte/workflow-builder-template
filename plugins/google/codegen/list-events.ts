export const listGoogleEventsCodegenTemplate = `// List Google Calendar events
const events = await googleCalendar.listEvents({
  calendarId: "{{calendarId}}",
  timeMin: "{{timeMin}}",
  timeMax: "{{timeMax}}",
  maxResults: {{maxResults}},
});`;
