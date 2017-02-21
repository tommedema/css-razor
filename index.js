const cheerio = require('cheerio')
const postcss = require('postcss')
const fs = require('fs')
const defaultConfig = require('./config')

// empty input
// no files

function cssRazor(config, cb) {
  config = Object.assign({}, defaultConfig, config)
  console.log(config);
  if ( !( (config.rawHtml || config.htmlFiles.length) && (config.rawCss || config.cssFiles.length) ) ) {
    throw new Error('You must include HTML and CSS for input.')
  }

  let rawHtml = config.rawHtml
  let rawCss = config.rawCss

  getFiles(config.htmlFiles, (html) =>
    getFiles(config.cssFiles, (css) =>
      processInput(html + rawHtml, css + rawCss)
    )
  )

  function getFiles(files, cb) {
    let text = ''
    if (files.length) {
      files.forEach((file, i) => {
        fs.readFile(file, (err, data) => {
          // Just add all the html in one big string.
          text += data.toString()

          if (i === files.length - 1) {
            cb(text)
          }
        })
      })
    }
  }

  function processInput(html, css) {
    postcss([
        cssRazorPlugin({
          html: html
        })
      ])
      .process(css, { from: config.inputCss, to: config.outputFile })
      .then((result) => {
        if (cb) cb(null, result)

        if (config.outputFile) {
          fs.writeFile(config.outputFile, result.css)
        }
      })
      .catch((e) => {
        console.log(e)
        // return Promise.reject(e)
      })
  }

  function cssRazorPlugin(opt) {
    const html = opt.html
    return (root) => {
      const $ = cheerio.load(html)
      return root.walk((node) => {
        if (node.type === 'rule') {
          const exists = checkExists(node, $)
          const ignore = config.ignore.some((ignore) => {
            return node.selector.indexOf(ignore) !== -1
          })
          if (!exists && !ignore) {
            node.remove()
          }
        }
      })
    }

  }

  function checkExists(node, $) {
    // Right now this try is needed because cheerio doesn't handle `pseudo-element` well.
    // See: https://github.com/cheeriojs/cheerio/issues/979
    try {
      return $(removePseudoClasses(node.selector)).length > 0
    } catch (e) {
      return true
    }
  }

  function removePseudoClasses(selector) {
    return [
      ':active',
      ':focus',
      ':hover',
      ':visited',
      '::before',
      ':before',
      '::after',
      ':after',
    ].reduce((p, c) => {
      return p.split(c).join('')
    }, selector)
  }
}

module.exports = {
  default: cssRazor,
  // plugin: cssRazorPlugin,
}
