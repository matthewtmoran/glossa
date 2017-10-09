export default function () {
  return (items, filterOptions) => {
    let filtered = [];
    angular.forEach(items, (tag) => {
      angular.forEach(filterOptions, (isfiltered, type) => {
        if (isfiltered && type === 'userTags' ) {
          if (tag.canEdit) {
            if (filtered.indexOf(tag) < 0) {
              filtered.push(tag);
            }
          }
        } else if (isfiltered && type === 'usedTags') {
          if (tag.occurrence > 0) {
            if (filtered.indexOf(tag) < 0) {
              filtered.push(tag);
            }
          }
        } else if (isfiltered && type === 'unusedTags') {
          if (tag.occurrence < 1) {
            if (filtered.indexOf(tag) < 0) {
              filtered.push(tag);
            }
          }
        } else if (isfiltered && type === 'systemTags') {
          if (!tag.canEdit) {
            if (filtered.indexOf(tag) < 0) {
              filtered.push(tag);
            }
          }
        }
      });
    });
    return filtered;
  };
}



// return function( items, filterOptions) {
//   var filtered = [];
//   angular.forEach(items, function (tag) {
//
//     angular.forEach(filterOptions, function (isfiltered, type) {
//       if (isfiltered && type === 'userTags' ) {
//         if (tag.canEdit) {
//           if (filtered.indexOf(tag) < 0) {
//             filtered.push(tag);
//           }
//         }
//       } else if (isfiltered && type === 'usedTags') {
//         if (tag.occurrence > 0) {
//           if (filtered.indexOf(tag) < 0) {
//             filtered.push(tag);
//           }
//         }
//       } else if (isfiltered && type === 'unusedTags') {
//         if (tag.occurrence < 1) {
//           if (filtered.indexOf(tag) < 0) {
//             filtered.push(tag);
//           }
//         }
//       } else if (isfiltered && type === 'systemTags') {
//         if (!tag.canEdit) {
//           if (filtered.indexOf(tag) < 0) {
//             filtered.push(tag);
//           }
//         }
//       }
//     });
//   });
//   return filtered;
// };