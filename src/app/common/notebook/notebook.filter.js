export default function () {
  return (notebooks, list) => {
    return notebooks.filter((notebook) => {
      if (list.indexOf(notebook.createdBy._id) != -1) {
        return true;
      } else if(list.length == 0) {
        return true;
      }
      return false;

    });
  };
}
