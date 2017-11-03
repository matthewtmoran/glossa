export default function () {
  return (notebooks, list) => {
    return notebooks.filter((notebook) => {
      if (list.length == 0) {
        return true;
      } else {
        return parseText(notebook.description);
      }
    });
  };
}

function parseText(text) {
  let hashReg = /(^|\s)(#[a-zA-Z\d-]+)/g;
  return hashReg.test(text);
}
