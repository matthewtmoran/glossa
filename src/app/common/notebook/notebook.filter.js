export default function () {
  // console.log('users 1', users);
  // console.log('list1', list);
  return (users, list) => {
    return users.filter((user) => {
      if (list.indexOf(user.createdBy._id) != -1) {
        return true;
      } else if(list.length == 0) {
        return true;
      }
      return false;

    });
  };
}
