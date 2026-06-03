const http = require("http");
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end("<h1>مرحباً من QIROX Sandbox!</h1>");
}).listen(PORT, () => console.log(`Server running on port ${PORT}`));
