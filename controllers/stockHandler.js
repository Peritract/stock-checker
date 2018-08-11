const request = require("request");
var MongoClient = require('mongodb');
const CONNECTION = "mongodb://" + process.env.USER +":" + process.env.KEY + "@" + process.env.HOST + "/" + process.env.DATABASE;

const get_url = function(stock){
   return "https://www.alphavantage.co/query?function=BATCH_QUOTES_US&symbols=" + stock + "&apikey=" + process.env.ALPHA_KEY;
}

const get_data = function(stock, callback){
  if (Array.isArray(stock)){
    let stocks = stock[0] + "," + stock[1];
    request(get_url(stocks), function(err, response, data){
    if (err){
        callback("failed connection", err)
      } else {
        let price_info = JSON.parse(data)["Stock Batch Quotes"]
        let stocksInfo = [];
        for (let i = 0; i < stock.length; i++){
          let stockInfo = {
            stock: stock[i],
            price: price_info[i]["5. price"],
            rel_likes: null
          }
          stocksInfo.push(stockInfo)
        }
        callback(null, stocksInfo)
      }
    })
  } else {
    request(get_url(stock), function(err, response, data){
      if (err){
        callback("failed connection", err)
      } else {
        let price_info = JSON.parse(data)["Stock Batch Quotes"][0]["5. price"]
        let stockInfo = {
          stock: stock,
          price: price_info,
          likes: null
        }
        callback(null, stockInfo)
      }
    })
  }
}

const get_likes = function(stock, like, ip, callback){
  if (Array.isArray(stock)){
    get_likes(stock[0], like, ip, function(err, doc){
      if (err){
        callback("Database error", err)
      } else {
        let likes = [doc];
        get_likes(stock[1], like, ip, function(err, doc){
          if (err){
            callback("Database error", err)
          } else {
            likes.push(doc);
            callback(null, likes)
          }
        })
      }
    })
  } else {
    MongoClient.connect(CONNECTION, function(err,db){
      if (err){
        callback("Database error", err)
      } else {
        if (!like){
          db.collection("stocks").find({stock: stock}).toArray(function(err,doc){
            if (err){
              callback("Database error", err);
            } else {
              if (doc.length > 0){
                let likes = doc[0].likes.length;
                callback(null, likes);
              }
              else{
                callback(null, 0);
              }
            }
          })
        } else {
          db.collection("stocks").findAndModify(
          {stock: stock},
          [],
          {$addToSet: { likes: ip }},
          {new: true, upsert: true},
          function(err, doc) {
            callback(null, doc.value.likes.length);
          });
        }       
      }
    })
  }
}

const get_stockData = function(stock, like, ip, callback){
  get_data(stock, function(err, data){
    if (err){
      callback("Failed to connect to external resource", err)
    } else {
      let stockData = data;
      get_likes(stock, like, ip, function(err, data){
        if (err){
          callback("Failed to connect to database", err)
        } else {
          if (Array.isArray(stock)){
            stockData[0].rel_likes = data[0] - data[1];
            stockData[1].rel_likes = data[1] - data[0];
            callback(null, {stockData: stockData});
          } else {
            stockData.likes = data;
            callback(null, {stockData: stockData});
          }
        }
      })
    }
  })
}

module.exports = {
  get_stockData: get_stockData
}