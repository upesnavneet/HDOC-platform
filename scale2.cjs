const fs = require('fs');
let css = fs.readFileSync('src/views/Profile.css', 'utf8');

// Scale all rem values
css = css.replace(/([\d\.]+)rem/g, (match, p1) => {
  if (p1 === '0') return match;
  const newSize = (parseFloat(p1) * 0.85).toFixed(3).replace(/\.?0+$/, '');
  return newSize + 'rem';
});

// Scale px values (excluding 1px/2px borders)
css = css.replace(/([\d\.]+)px/g, (match, p1) => {
  const val = parseFloat(p1);
  if (val <= 2) return match; // don't scale thin borders
  const newSize = Math.round(val * 0.85);
  return newSize + 'px';
});

fs.writeFileSync('src/views/Profile.css', css);
console.log('Scaled down Profile.css successfully.');
