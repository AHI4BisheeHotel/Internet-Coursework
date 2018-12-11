var http = require("http");
var path = require("path");
var fs = require("fs");
var db = require("./db");
var qs = require("querystring");
var uniqueRandom = require("unique-random");
var rand = uniqueRandom(100, 100000);
var rand2 = uniqueRandom(100, 100000);

//create a server object:
http
  .createServer(function(req, res) {
    //res.writeHead(200, {'Content-Type': 'text/html'}); // http header

    var sendFile = function(thePath) {
      // parse URL
      var parsedUrl = require("url").parse(req.url);
      // extract URL path
      let pathname = `./public${parsedUrl.pathname}`;

      // based on the URL path, extract the file extention. e.g. .js, .doc, ...
      var ext = path.parse(pathname).ext;

      // maps file extention to MIME typere
      var map = {
        ".ico": "image/x-icon",
        ".html": "text/html",
        ".js": "text/javascript",
        ".json": "application/json",
        ".css": "text/css",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".wav": "audio/wav",
        ".mp3": "audio/mpeg",
        ".svg": "image/svg+xml",
        ".pdf": "application/pdf",
        ".doc": "application/msword"
      };

      fs.exists(pathname, function(exist) {
        if (!exist) {
          // if the file is not found, return 404
          res.statusCode = 404;
          res.end(`File ${pathname} not found!`);
          return;
        }

        // if is a directory search for index file matching the extention
        if (fs.statSync(pathname).isDirectory()) pathname += "/index" + ext;

        // read file from file system
        fs.readFile(pathname, function(err, data) {
          if (err) {
            res.statusCode = 500;
            res.end(`Error getting the file: ${err}.`);
          } else {
            // if the file is found, set Content-type and send data
            res.setHeader("Content-type", map[ext] || "text/plain");
            res.end(data);
          }
        });
      });
    };

    /**
     * Check the proper route to implement
     */
    var url = req.url;
    let body = "";
    switch (url) {
      case "/addcustomer":
        res.writeHead(200, {
          "Content-Type": "application/json"
        });

       body = "";

        req.on("data", chunk => {
          body += chunk.toString();
        });

        req.on("end", () => {
          body = qs.parse(body);
          console.log(url + "  " + JSON.stringify(body) + "\n");

          const cno = rand();

          db.query(
            `INSERT INTO hotelbooking.customer (c_no, c_name,c_email,c_address,c_cardtype,c_cardexp,c_cardno) 
                    VALUES($1,$2,$3,$4,$5,$6,$7)`,
            [cno, (body.title + body.name), body.email,body.address,body.cardtype,body.cardexpiry,body.cardnumber],
            (err, result) => {
              if (!err) {
                const bref = rand2();

                db.query(
                  `INSERT INTO hotelbooking.booking (b_ref, c_no, b_cost, b_outstanding, b_notes) 
                            VALUES($1,$2,$3,$4,$5)`,
                  [bref, cno, body.price, body.price, ""],
                  (err, result) => {
                    if (!err) {
                      res.end(
                        JSON.stringify({
                          bref: bref
                        })
                      );
                    } else {
                      res.end("{'success': false}");
                      console.log(err);
                    }
                  }
                );
              } else {
                res.end("{success: false}");
                console.log(err);
              }
            }
          );
        });
        break;
      case "/book":
        res.writeHead(200, {
          "Content-Type": "application/json"
        });
        body = "";

        req.on("data", chunk => {
          body += chunk.toString();
        });

        req.on("end", () => {
          body = qs.parse(body);
          console.log(url + "  " + JSON.stringify(body) + "\n");

          db.query(
            "INSERT INTO hotelbooking.food (f_name, d_description, f_price) VALUES($1, $2, $3)",
            ["breakfast", "breakfast", 10],
            function(err, result) {
              if (!err) {
                res.end("{success: true}");
              } else {
                res.end("{success: false}");
                console.log(err);
              }
            }
          );
        });

        break;
      case "/bookroom":
        res.writeHead(200, {
          "Content-Type": "application/json"
        });
        body = "";

        req.on("data", chunk => {
          body += chunk.toString();
        });

        req.on("end", () => {
          body = qs.parse(body);
          console.log(url + "  " + JSON.stringify(body) + "\n");

          db.query(
            `INSERT INTO hotelbooking.roombooking (r_no, b_ref, checkin, checkout,b_status) 
                    VALUES($1,$2,$3,$4,$5)`,
            [body.roomno, body.bref, body.checkindate, body.checkoutdate, "B"],
            (err, result) => {
              if (!err) {
                db.query(`UPDATE hotelbooking.room SET no_of_people=$1,r_status='A' WHERE r_no=$2`,
                  [Number(body.adultcount), body.roomno],
                  (err, result) => {
                    if (!err) {
                      res.end("{'success': true, 'action': 'booking/roombooking'}");
                    } else {
                      res.end("{'success': false}");
                      console.log(err);
                    }
                  }
                );
              } else {
                res.end("{'success': false}");
                console.log(err);
              }
            }
          );
        });
        break;
      case "/check":
        res.writeHead(200, {
          "Content-Type": "application/json"
        });

       body = "";

        req.on("data", chunk => {
          body += chunk.toString();
        });

        req.on("end", () => {
          body = qs.parse(body);
          console.log(url + "  " + JSON.stringify(body) + "\n");

          const query = `SELECT room.r_no,room.r_class,rates.price from hotelbooking.room
              INNER JOIN hotelbooking.rates ON rates.r_class=room.r_class
              AND room.r_status='A'`;

          db.query(query, [], function(err, result) {
            if (!err) {
              res.end(JSON.stringify(result.rows));
            } else {
              console.log(err);
              res.end(
                JSON.stringify({
                  status: "error"
                })
              );
            }
          });
        });

        break;
      default:
        sendFile();
        break;
    }
  })
  .listen(8080, function() {
    console.log("server start at port 8080"); //the server object listens on port 8080
  });