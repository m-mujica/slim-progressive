var path = require("path");
var stealTools = require("steal-tools");

stealTools.build({
  config: path.join(__dirname, "package.json!npm")
}, {
  minify: false
});
