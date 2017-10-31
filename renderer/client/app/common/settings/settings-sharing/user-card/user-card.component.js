import templateUrl from './user-card.html';

export const userCardComponent = {
  bindings: {
    user: '<',
    onToggleFollow: '&'
  },
  templateUrl,
  controller: class UserCardComponent {
    constructor() {
      'ngInject';
    }

    $onInit() {
      this.alphabetColors = ["#5A8770", "#B2B7BB", "#6FA9AB", "#F5AF29", "#0088B9", "#F18636",
        "#D93A37", "#A6B12E", "#5C9BBC", "#F5888D", "#9A89B5", "#407887", "#9A89B5",
        "#5A8770", "#D33F33", "#A2B01F", "#F0B126", "#0087BF", "#F18636", "#0087BF",
        "#B2B7BB", "#72ACAE", "#9C8AB4", "#5A8770", "#EEB424", "#407887"];

      this.colorIndex = Math.floor((this.user.name.charCodeAt(0) - 65) % this.alphabetColors.length);

      this.user.color = this.alphabetColors[this.colorIndex];

    }

    toggleFollow() {
      this.onToggleFollow({
        $event: {
          user: this.user
        }
      });
    }

  }
};