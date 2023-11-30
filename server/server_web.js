const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require('express');

const server = express();

// 设置静态文件中间件
// server.use(express.static(path.join(__dirname,'game')));
server.use(express.static(path.join(__dirname)));


// 通配符路由，响应所有HTML请求
// server.get('*', (req, res) => {
//     // fs.readFile(path.join(__dirname, req.url),(err,data)=>{
//     //     if(err){
//     //         res.statusCode=404;
//     //         res.end("404 Not Found");
//     //         return;
//     //     }
//     //     res.end(data);
//     // })
//   res.sendFile(path.join(__dirname, req.url));
// });

// 监听8003端口
server.listen(8010, () => {
  console.log('Server is running at http://localhost:8010');
});
