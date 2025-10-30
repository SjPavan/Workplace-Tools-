export function debounce(fn, wait) {
  let timeoutId;
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), wait);
  };
}

export function toTitleCase(str) {
  if (!str) return '';
  return str.replace(/[^\s]+/g, token => {
    return token.split(/(-)/).map(part => {
      return part.replace(/[A-Za-zÀ-ÖØ-öø-ÿ]+[^\s]*/g, word => {
        const match = word.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/);
        if (!match) return word;
        const index = match.index;
        return word.slice(0, index) + word.charAt(index).toUpperCase() + word.slice(index + 1).toLowerCase();
      });
    }).join('');
  });
}

export default {
  debounce,
  toTitleCase
};
