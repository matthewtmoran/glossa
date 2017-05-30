export default function () {
  return (notebooks, list) => {
    return notebooks.filter((notebook) => {
      let exists;
      if (list.length == 0) {
        exists = true;
      } else {
        if (notebook.hashtags.length < 0) {
          exists = false;
        } else {
          notebook.hashtags.forEach((tag) => {
            if (list.indexOf(tag._id) != -1) {
              exists = true;
            }
          });
        }
      }
      return exists;

    });
  };
}
