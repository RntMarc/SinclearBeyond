export function escapeVCard(str) {
  if (!str) return "";
  return str
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
}

export function generateVCARD(contact) {
  let vcf = "BEGIN:VCARD\r\n";
  vcf += "VERSION:3.0\r\n";
  vcf += `FN:${escapeVCard(contact.displayName)}\r\n`;
  // Requirement: Display name as First Name
  vcf += `N:;${escapeVCard(contact.displayName)};;;\r\n`;

  if (contact.email) {
    vcf += `EMAIL;TYPE=INTERNET:${escapeVCard(contact.email)}\r\n`;
  }

  if (contact.birthday) {
    const bday = new Date(contact.birthday);
    const year = bday.getUTCFullYear();
    const month = String(bday.getUTCMonth() + 1).padStart(2, "0");
    const day = String(bday.getUTCDate()).padStart(2, "0");
    vcf += `BDAY:${year}-${month}-${day}\r\n`;
  }

  const signal = contact.signalNumber?.trim();
  const whatsapp = contact.whatsappNumber?.trim();

  if (signal || whatsapp) {
    if (signal === whatsapp) {
      vcf += `TEL;TYPE=CELL,VOICE;X-SIGNAL;X-WHATSAPP:${escapeVCard(signal)}\r\n`;
    } else {
      if (signal) {
        vcf += `TEL;TYPE=CELL,VOICE;X-SIGNAL:${escapeVCard(signal)}\r\n`;
      }
      if (whatsapp) {
        vcf += `TEL;TYPE=CELL,VOICE;X-WHATSAPP:${escapeVCard(whatsapp)}\r\n`;
      }
    }
  }

  if (contact.discordHandle) {
    vcf += `X-DISCORD:${escapeVCard(contact.discordHandle)}\r\n`;
  }
  if (contact.matrixHandle) {
    vcf += `X-MATRIX:${escapeVCard(contact.matrixHandle)}\r\n`;
  }
  if (contact.fluxerHandle) {
    vcf += `X-FLUXER:${escapeVCard(contact.fluxerHandle)}\r\n`;
  }
  if (contact.instagramHandle) {
    vcf += `X-INSTAGRAM:${escapeVCard(contact.instagramHandle)}\r\n`;
  }
  if (contact.mastodonHandle) {
    vcf += `X-MASTODON:${escapeVCard(contact.mastodonHandle)}\r\n`;
  }
  if (contact.blueskyHandle) {
    vcf += `X-BLUESKY:${escapeVCard(contact.blueskyHandle)}\r\n`;
  }

  vcf += `UID:${contact.id}@sinclear.beyond\r\n`;
  vcf += "END:VCARD\r\n";
  return vcf;
}

export function generateVCard(contacts) {
  return contacts.map((c) => generateVCARD(c)).join("");
}
