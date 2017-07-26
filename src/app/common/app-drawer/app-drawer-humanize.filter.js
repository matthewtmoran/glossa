export default function () {
  return (doc) => {
    if (!doc) return;
    if (doc.type === 'directive') {
      return doc.name.replace(/([A-Z])/g, ($1) => {
        return '-' + $1.toLowerCase();
      });
    }
    return doc.label || doc.name;
  };
}
