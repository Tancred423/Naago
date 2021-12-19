module.exports = class GlobalUtil {
  static closeStream() {
    if (this.stream) {
      this.stream.close()
      console.log('Twitter stream closed')
    }
  }
}
