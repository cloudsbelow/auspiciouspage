import fs from 'fs'
import http from 'http'

const contentTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
}
function rejectReq(num, res, err){
  console.log("rejected a request with reason "+num+" for "+err);
  res.writeHead(num, { 'Content-Type': 'text/plain' });
  if(num == 404) res.end('not found');
  if(num == 500) res.end('server error');
}

const server = http.createServer((req, res) => {
  //console.log("SERVING: "+ req.url, req.method);
  const spath = req.url.split('/');
  if(req.method === 'GET'){
    const file = req.url=='/'?"index.html":req.url.slice(1);
    fs.access(file, fs.constants.R_OK, (err)=>{
      if(err) return rejectReq(404, res, err);
      const fstream = fs.createReadStream(file);
      res.writeHead(200, {'Content-Type': contentTypes[file.match(/\.[a-zA-Z]+$/)?.[0]]})
      fstream.pipe(res);
      fstream.on('close', ()=>{res.end()});
    });
  }
});
const port = 3000;
server.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});





