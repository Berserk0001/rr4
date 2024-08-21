function copyHeaders(source, target) {
  for (const [key, value] of Object.entries(source.headers)) {
    try {
      target.header(key, value);
    } catch (e) {
      console.log(e.message);
    }
  }
}

module.exports = copyHeaders;
