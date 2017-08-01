<template>
  <div class="content">
    <h1>简易串口调试工具</h1>
    <div class="headerWrapper">
      <span>
        设备列表：
        <select v-model="selDevice">
          <option v-for="item in serialList" :key="item">
            {{item}}
          </option>
        </select>
        波特率：
        <select v-model="selBaudRate">
          <option v-for="item in baudRate" :key="item">
            {{item}}
          </option>
        </select>
        <button :disabled="status" @click="openDriver">连接</button>
        <button :disabled="!status" @click="closeDriver">断开</button>
      </span>
      <div>
        hex发送:
        <input type="checkbox" id="hexCheckbox" v-model="hexCheckbox">
        hex显示:
        <input type="checkbox" id="hexShow" v-model="hexShow">
      </div>
      <div>

   当前的连接状态:{{status?'连接':'断开'}}

      </div>
      <div>
        <p>接收的数据</p>
        <textarea cols="60" rows="5" v-model="recvContent" id="recvContent" ref="recvContent"></textarea>
      </div>
    </div>
    <div>
      <div>发送的数据:
        <select v-model="selRule">
          <option v-for="(index,option) in rule_list" :key="option">
            {{option}}
          </option>
        </select>
      </div>
      <textarea cols="60" rows="3" v-model="sendContent" placeholder="send hex data"></textarea>
    </div>
    <input type="file" @change="previewContent"><br/>
    <button @click="sendMessage">发送</button>
  </div>
</template>
<style>

</style>
<script>
import { readFileSync } from 'fs'
import { getSerialPortList } from '../../common/serialport'
var SerialPort = require('serialport')
export default {
  data () {
    return {
      serialList: [],
      selDevice: '',
      baudRate: [
        '4800',
        '9600',
        '19200',
        '38400',
        '76800',
        '115200'
      ],
      selBaudRate: '',
      sendContent: '',
      device: {},
      deviceStatus: false,
      status: false,
      hexCheckbox: false,
      hexShow: false,
      recvContent: '',
      rule_list: {},
      selRule: ''
    }
  },
  computed: {
  },
  watch: {
    selRule: function (value) {
      this.sendContent = this.rule_list[value]
    }
  },
  methods: {
    sendMessage: function () {
      if (!this.status) return
      // let content = this.sendContent + '\r'
      let content = this.sendContent
      if (this.hexCheckbox) {
        let d = content.split(' ').map(function (d) {
          return parseInt(d, 16)
        })
        d.push('\0')
        this.device.write(d)
      } else {
        this.device.write(content + '\0')
      }
    },
    previewContent: function (event) {
      var input = event.target
      // this.rule_list.clear()
      if (input.files && input.files[0]) {
        let data = readFileSync(input.files[0].path).toString().split('\n')
        let self = this
        data.forEach(function (data) {
          if (data !== '') {
            let tmp = data.split(':')
            if (tmp.length >= 2) {
              self.rule_list[tmp[0]] = tmp[1]
            }
            console.log(self.rule_list)
          }
        })
      }
      this.$forceUpdate()
    },
    openDriver: function () {
      let baudrate = this.selBaudRate
      // let self = this
      if (this.status) return
      if (this.device.isOpen) return
      if (this.selDevice === '') {
        alert('必须选择设备')
        return
      }
      this.device = new SerialPort(`/dev/${this.selDevice}`, {
        baudRate: parseInt(baudrate)
      })
      this.device.on('data', this.recvData)
      this.device.on('error', this.onError)
      // this.device.on('readable', this.recvData)
      setInterval(this.checkDeviceStatus, 200)
    },
    closeDriver: function () {
      if (!this.status) return
      this.device.close(() => {
        console.log('close')
      })
    },
    checkDeviceStatus: function () {
      this.status = this.device === undefined ? false : this.device.isOpen
    },
    recvData: function (data) {
      let str = ''
      var self = this
      if (!self.hexShow) {
        this.recvContent = `${data}\n${this.recvContent}`
        return
      }
      data.map(function (data) {
        if (data <= 0xf) {
          str += '0' + data.toString(16) + ' '
        } else {
          str += data.toString(16) + ' '
        }
      })
      this.recvContent = `${str}\n${this.recvContent}`
      var textarea = document.getElementById('recvContent')
      textarea.scrollTop = 0 //  将其自动滚动到顶部
    },
    onError: function (err) {
      alert(err)
    }
  },
  mounted: function () {
    let SerialList = getSerialPortList()
    let self = this
    SerialList.then(function (data) {
      self.serialList = data
    })
  }
}
</script>
