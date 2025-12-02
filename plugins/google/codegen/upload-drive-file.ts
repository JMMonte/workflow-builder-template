export const uploadDriveFileCodegenTemplate = `// Upload file to Google Drive
const file = await googleDrive.upload({
  fileUrl: "{{fileUrl}}",
  mimeType: "{{mimeType}}",
  destinationFolderId: "{{folderId}}",
});`;
