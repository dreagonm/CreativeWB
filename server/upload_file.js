var fileType = require('file-type'),
    path = require('path'),
    fs = require('fs'),
    pdf2img = require('pdf2img'),
    readxlsxfile = require("read-excel-file/node"), // parse .xlsx
    xlsx = require("xlsx"); // parse .xls


const pdf_path = path.join('client-data', 'tools', 'image', 'upload.pdf');
const xlsx_path = path.join('client-data', 'tools', 'image', 'upload.xlsx');
const xls_path = path.join('client-data', 'tools', 'image', 'upload.xls');
const img_dir = path.join('client-data', 'tools', 'image');
const img_path = path.join('client-data', 'tools', 'image', 'converted_1.jpg');
pdf2img.setOptions({
   type: 'jpg',                                // png or jpg, default jpg
   size: 1024,                                 // default 1024
   density: 600,                               // default 600
   outputdir: img_dir, // output folder, default null (if null given, then it will create folder name same as file name)
   outputname: 'converted',                         // output file name, dafault null (if null given, then it will create image name same as input name)
   page: null,                                 // convert selected page, default null (if null given, then it will convert all pages)
   quality: 100                                // jpg compression quality, default: 100
});

function set(io) {
    io.on("connection", (socket) => {
        socket.on("upload", (buf, callback) => {
            console.log("uploaded buf:", buf);
            var buffer, filetype, base64;
            (async () => {
                buffer = Buffer.from(buf);
                filetype = await fileType.fromBuffer(buffer);
                //=> {ext: 'png', mime: 'image/png'}
                console.log("converted file type:", filetype);
                if (filetype.ext == 'pdf') {
                    // .pdf
                    fs.writeFileSync(pdf_path, buf, function(err, info) {
                        if (err) console.log(err)
                        else console.log(info);
                    });
                    await pdf2img.convert(pdf_path, function(err, info) {
                        if (err) console.log(err)
                        else console.log(info);
                    });
                    buffer = fs.readFileSync(img_path);
                    // console.log(buffer);
                    base64 = buffer.toString('base64');
                    callback(base64);
                }
                else if (filetype.ext == 'xlsx') {
                    // .xlsx
                    fs.writeFileSync(xlsx_path, buf, function(err, info) {
                        if (err) console.log(err)
                        else console.log(info);
                    });
                    readxlsxfile(xlsx_path).then((rows) => {
                        // `rows` is an array of rows
                        // each row being an array of cells.
                        // for(var i = 0; i < rows.length; i++) 
                        //     for(var j = 0; j < rows[i].length; j++)
                        //         console.log(rows[i][j]);
                        callback(rows);
                    });
                }
                else {
                    base64 = buffer.toString('base64');
                    callback(base64);
                }
            })().catch(err => {
                console.log("err:", err);
            });
        });
    });
}
module.exports = { set:set };