export default function () {
  return function (value = '') {
    return (!value) ? '' : value.replace(/ /g, '');
  }
}
