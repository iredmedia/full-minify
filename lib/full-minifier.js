// Include modules for use
var fs         = require('fs'),
    compressor = require('../node_modules/node-minify/lib/node-minify'),
    b64img     = require('../node_modules/css-b64-images-no-limit/lib/css-b64-images'),
    cleanCSS   = require('../node_modules/clean-css/lib/clean');

/**
 * Two functions, FullMinifier.js() and FullMinifier.css() accepts an array of
 * paths (strings) of files to be aggregated minified.
 *
 * @param fileList   array   String paths relative to this functions file.
 * @param noCompress boolean Option to lleave files uncompressed (if true).
 * @param callback   object  Function to execute after completion.
 */
var FullMinifier = {
  'rootPath': '/',
  'ask': function(question, callback) {
    var stdin = process.stdin,
        stdout = process.stdout;  

    stdin.resume(); 
    stdout.write(question + ": ");  
    stdin.once('data', function(data) {   
      data = data.toString().trim();    
      callback(!!data);  
    });
  },
  'css': function(fileList, noCompress, callback) {
    var compressedSource = '',
        minifiedPath = __dirname + '/public/css/base-min.css';

    // Clear minfied file file
    fs.writeFile(minifiedPath, '', function (err, results) {
        if(err) console.error('ERROR: while clearing file. ', err);
    });

    // Loop through files to compress
    for (var fileHandle in fileList) {
      // Get file contents, and relative paths
      var fileContents = fs.readFileSync(fileList[fileHandle], {'encoding': 'utf8'}),
          filePath     = fileList[fileHandle].split('/');

      filePath.pop();
      filePath = filePath.join('/');

      // Itterate file contents, and rewrite image references as Base64 (async).
      b64img.fromString(fileContents, filePath, this.rootPath, function(err, css){
        if(err) console.error('ERROR: while converting to base64 images. ', err);

        // While looping through files, continually append new resulting css (async).
        fs.appendFile(minifiedPath, noCompress ? css : cleanCSS.process(css), function (err) {
          if (err) {
            console.log('ERROR: while minifying css: ', err);

            throw err;
          }

          callback && callback();
        });
      });
    }

    console.log('CSS has been aggregated with base64 images', !noCompress ? 'and minified!' : '!');
  },
  'js': function (fileList, noCompress, callback) {
    var minifiedPath = __dirname + '/public/js/base-min.js';

    // Clear minfied file file
    fs.writeFile(minifiedPath, '', function (err, results) {
      if(err) {
        console.error('ERROR: could not clear file. ', err);

        throw err
      }

      // Minify Javascript
      new compressor.minify({
        type: noCompress ? 'no-compress' : 'yui-js',
        fileIn: fileList,
        fileOut: minifiedPath,
        callback: function(err, min){
          if (err) {
            console.log('ERROR: while minifying js. ', err);

            throw err;
          }

          console.log('JS has been successfully aggregated', !noCompress ? 'and minified!' : '!');

          callback && callback();
        }
      });
    });
  }
}

module.exports = FullMinifier;
