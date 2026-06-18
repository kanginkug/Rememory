export function renderTextWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (!part.match(/^https?:\/\/|^www\./)) return part;
    const href = part.startsWith('www.') ? `https://${part}` : part;
    return (
      <a key={i} href={href} target="_blank" rel="noopener noreferrer"
        style={{ color: '#7F77DD', textDecoration: 'underline', wordBreak: 'break-all' }}
        onClick={e => e.stopPropagation()}
      >{part}</a>
    );
  });
}
