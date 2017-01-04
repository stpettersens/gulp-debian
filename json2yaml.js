'use strict'

/* Convert JSON package file to YAML package file */

const YAML = require('js-yaml')
const fs = require('fs-extra')

module.exports.JSON2YAML = function (jsonf) {
  let yamlf = jsonf.split('.json')
  yamlf = `${yamlf[0]}.yml`
  const json = fs.readJSONSync(jsonf)
  json.package = `${json.package.replace(/json/, 'yaml')}`
  const yaml = YAML.safeDump(json)
  console.log(yaml)
  fs.writeFileSync(yamlf, yaml)
}
