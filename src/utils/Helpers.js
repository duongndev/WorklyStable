export const parseDate = (str, mode) => {
  if (!str) return new Date();
  if (mode === 'date') {
    const parts = str.split('/');
    if (parts.length === 3) {
      return new Date(parts[2], parts[1] - 1, parts[0]);
    }
  } else if (mode === 'time') {
    const [h, m] = str.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }
  return new Date();
};

export const formatOutput = (date, mode) => {
  if (!date) return '';
  if (mode === 'date') {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } else {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
};

