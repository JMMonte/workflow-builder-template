export const createTeamsMessageCodegenTemplate = `// Send Teams message
const message = await teams.sendMessage({
  teamId: "{{teamId}}",
  channelId: "{{channelId}}",
  content: "{{content}}",
});`;
