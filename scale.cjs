const fs = require('fs');
let css = fs.readFileSync('src/views/Profile.css', 'utf8');
css = css.replace(/font-size:\s*([\d\.]+)rem;/g, (match, p1) => {
  const newSize = (parseFloat(p1) * 0.9).toFixed(3).replace(/\.?0+$/, '');
  return 'font-size: ' + newSize + 'rem;';
});
fs.writeFileSync('src/views/Profile.css', css);
