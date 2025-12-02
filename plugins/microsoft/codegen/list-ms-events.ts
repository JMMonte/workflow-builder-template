export const listMicrosoftEventsCodegenTemplate = `// List Microsoft Calendar events
const events = await outlookCalendar.listEvents({
  calendarId: "{{calendarId}}",
  timeMin: "{{timeMin}}",
  timeMax: "{{timeMax}}",
  maxResults: {{maxResults}},
});`;
