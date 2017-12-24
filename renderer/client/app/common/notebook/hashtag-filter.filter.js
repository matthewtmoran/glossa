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
