export const searchDriveCodegenTemplate = `// Search Google Drive
const results = await googleDrive.search({
  query: "{{query}}",
  limit: {{limit}},
});`;
