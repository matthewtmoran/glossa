export default function () {
  return (notebooks, list) => {
    return notebooks.filter((notebook) => {
      if (list.length == 0) {
        return true;
      } else {

        let tagExist = false;
        list.forEach((tag) => {
          if (notebook.description.indexOf(`#${tag}`) > -1 ) {
            tagExist = true;
            return true;
          }
        });
        return tagExist;
      }
    });
  };
}

function parseText(text, list) {
  let hashReg = /(^|\s)(#[a-zA-Z\d-]+)/g;

  list.forEach((tag) => {
    if (text.indexOf(`#${tag}`) > -1) {
      console.log('Exists!');
      console.log('Text:', text);
      return true;
    } else {
      return false;
    }
  });
}
