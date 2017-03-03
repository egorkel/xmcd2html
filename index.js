const fs = require('fs');
const path = require('path');
const xml = require('xml2js');

const parser = new xml.Parser();

const div = '<div style="top: TOPpx; left: LEFTpx">';
const img = '<img style="top: TOPpx; left: LEFTpx" src="SRC">';
const xFactor = 1.3;
const yFactor = 1.5;
const src = 'src';
const dest = 'dest';

if (fs.existsSync(src)) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest);
  }

  let files = fs.readdirSync(src);
  for (let i of files) {
    convert(i);
  }
}

function convert(name) {
  const xmlContent = fs.readFileSync(path.join(src, name), {encoding: 'UTF-8'});
  let htmlContent = fs.readFileSync('template.html', {encoding: 'UTF-8'});

  parser.parseString(xmlContent, (err, data) => {
    let images = {};
    const {item} = data.worksheet.binaryContent[0];

    for (let i of item) {
      if (i.$['content-encoding']) {
        continue;
      }

      let id = i.$['item-id'];
      images[id] = `data:image/png;base64,${i._.replace(/\n+\s*/g, '')}`;
    }

    const {region} = data.worksheet.regions[0];

    for (let i of region) {
      if (i.text) {
        let {top, left} = i.$;
        top = +top * yFactor;
        left = +left * xFactor;
        let curDiv = div.replace('TOP', top).replace('LEFT', left);

        for (let j of i.text[0].p) {
          curDiv += `<p>${j._.replace(/\n+\s*/g, ' ').replace(/\s$/, '')}</p>`;
        }

        curDiv += '</div>';
        htmlContent = htmlContent.replace('<!--inject-->', `${curDiv}\n  <!--inject-->`);
      }

      if (i.rendering) {
        let id = i.rendering[0].$['item-idref'];

        if (images[id]) {
          let {top, left} = i.$;
          top = +top * yFactor;
          left = +left * xFactor;
          let curImg = img.replace('TOP', top).replace('LEFT', left).replace('SRC', images[id]);
          curImg += '</img>';
          htmlContent = htmlContent.replace('<!--inject-->', `${curImg}\n  <!--inject-->`);
        }
      }
    }

    htmlContent = htmlContent.replace('TITLE', name);
    fs.writeFileSync(path.join(dest, `${name.replace(/\.\w+$/, '')}.html`), htmlContent);
  });
}
