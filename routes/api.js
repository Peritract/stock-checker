/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var stockHandler = require("../controllers/stockHandler")


const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(function (req, res){
      let stock = req.query.stock;
      let like = req.query.like || false;
      let ip = req.connection.remoteAddress;
      stockHandler.get_stockData(stock, like, ip, function(err, data){
        if (err){
          res.send(err);
        } else {
          res.send(data);
        }
      })
    });
    
};
