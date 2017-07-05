export default function () {
  return (notebooks, list) => {
    let filteredNotebooks = notebooks.filter((notebook) => {
      if (list.indexOf(notebook.createdBy._id) > -1) {
        return true;
      } else if(list.length == 0) {
        return true;
      }
      return false;
    });
    return filteredNotebooks.sort((a, b) => {
      return new Date(a.createdAt).getTime() > new Date(b.createdAt).getTime() ? -1 : 1;
    })
  };
}
