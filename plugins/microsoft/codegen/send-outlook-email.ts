export const sendOutlookEmailCodegenTemplate = `// Send Outlook email
const response = await outlook.sendEmail({
  to: "{{to}}",
  subject: "{{subject}}",
  body: "{{body}}",
});`;
