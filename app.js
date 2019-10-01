var express = require('express');
var levenshtein = require('fast-levenshtein');
const app = express();
const path = require('path');
const router = express.Router();
const csv = require('csv-parser')
const fs = require('fs');
const bodyParser = require('body-parser')
const multer = require('multer');
const uploadFolder = './uploads/'

// SET STORAGE
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadFolder)
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

var upload = multer({ storage: storage })

router.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

router.get('/js/script.js',function(req,res){
  res.sendFile(path.join(__dirname + '/js/script.js')); 
});

// upload csv file
router.post('/uploadfile', upload.single('csvFile'), function (req, res) {
  const file = req.file
  console.log(" Original File name - " + req.file.originalname);

  if (!file) {
    let error = new Error('Please upload a file')
    error.httpStatusCode = 400
    res.send(error);
  }
  else {
    let results = [];
    
    fs.createReadStream(file.originalname)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        // variables for JSON outout
        var possibleDupJSON = [];
        var noneDupJSON = [];

        // variables for text output
        var finalResult = "<html><head></head><body>";
        var possibleDup = "Potential Duplicates <br>";
        var NoneDup = "None Duplicates <br>";
        
        var csvLength = results.length;

        // Adding isDuplicate attribute to each array element
        results.map(function(e){
          e.isDuplicate = false;
        });

        for (i = 0; i < csvLength; i++) {

          if (!results[i].isDuplicate) {

            var srcJSON = results[i];
            var src = JSON.stringify(results[i]);
            var srcLength = src.length;

            for (j = i + 1; j < csvLength; j++) {

              // Checking if row is already marked for duplicate
              if (!results[j].isDuplicate) {

                let trgtJSON = results[j];
                var trgt = JSON.stringify(results[j]);
                var normDistance = levenshtein.get(src, trgt) / (srcLength + trgt.length)

                // Checking for the potential duplicates
                if (normDistance < 0.05) {  // range of normal distance for possible duplicates and exact duplicate 0.05 < x <=0
                  results[i].isDuplicate = true;
                  results[j].isDuplicate = true;

                  // Adding objects to array for JSON output
                  possibleDupJSON.push(srcJSON);
                  possibleDupJSON.push(trgtJSON);

                  let dupSrcRow = "";
                  let duptrgtrow = "";

                  // Adding values of JSON object to string
                  Object.keys(srcJSON).forEach(function (key) {
                    if(!(key == "isDuplicate")){
                        dupSrcRow = dupSrcRow + srcJSON[key] + ","
                    }
                  });
                  dupSrcRow = dupSrcRow.slice(0, -1);

                  Object.keys(trgtJSON).forEach(function (key) {

                    if (!(key == "isDuplicate")){
                    duptrgtrow = duptrgtrow + trgtJSON[key] + ","
                    }
                  });

                  duptrgtrow = duptrgtrow.slice(0, -1);
                  possibleDup = possibleDup + "<li>" + dupSrcRow + "</li>" + "<li>" + duptrgtrow + "</li>";

                }
              }

            }
          }

          // if row object is not marked duplicate then add to separate string
          if(!results[i].isDuplicate){
            let noDupRow = "";

            noneDupJSON.push(srcJSON); // adding object to arraay

            Object.keys(srcJSON).forEach(function (key) {
              if(!(key == "isDuplicate")){
                  noDupRow = noDupRow + srcJSON[key] + ","
              }
            });

            noDupRow = noDupRow.slice(0, -1);
            NoneDup = NoneDup + "<li>" + noDupRow + "</li>";
          }

        }

        // removing isDuplicate from the possibleDupJSON object
        for(var k = 0 ; k < possibleDupJSON.length; k++){
          delete possibleDupJSON[k]['isDuplicate'];
        }

        // removing isDuplicate from the noneDupJSON object
        for(var k = 0 ; k < noneDupJSON.length; k++){
          delete noneDupJSON[k]['isDuplicate'];
        }
        var toggleButton = "<button onclick='toggleOutput()'>Click Here to toggle JSON output</button></br>";
        var jsonDiv = "<div id ='togglDiv' style='display:none'> <p><b> Potential Duplicate Records : </b></p></br> " + JSON.stringify(possibleDupJSON) + "</br></br>"
                      + "<p><b> Unique Records : </b></p></br>" + JSON.stringify(noneDupJSON) + "</div></br>";
        var txtDiv = "<div id='txtDiv' style='display:block'>" + possibleDup + "</br></br>" + NoneDup + "</div>";

        
        finalResult = finalResult + toggleButton + jsonDiv + txtDiv + "</body><script src='./js/script.js'></script></html>";
        res.send(finalResult);
      });
  }
});

//add the router
app.use('/', router);
app.listen(process.env.port || 3000);

console.log('Running at Port 3000');