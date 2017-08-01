let Promise = require('bluebird')
let fs = Promise.promisifyAll(require('fs'))
var getSerialPortList = async function () {
  let fileList = await fs.readdirSync('/dev')
  let regex = new RegExp('ttyUSB[0-9]{1,2}')
  fileList = fileList.filter((file) => {
    return file.match(regex) != null
  })
  return fileList
}
export {
  getSerialPortList
}
