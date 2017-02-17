#!/usr/local/bin/node

const cssRazor = require('./index.js')

if (process.argv && process.argv.length > 2) {
  const options = {}
  process.argv.forEach((arg) => {
    if (arg.indexOf('.html') === arg.length - 5) {
      options.inputHtml = arg
    } else if (arg.indexOf('.css') === arg.length - 4) {
      options.inputCss = arg
    }
    // TODO: Set more CLI options here.
  })

  cssRazor(options, (err, data) => {
    process.stdout.write(data.css)
    // process.exit(0)
  })
} else {
  throw new Error('You need to pass arguments to css-razor')
}