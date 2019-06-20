var express = require('express');
var router = express.Router();
let utility = require('utility')
let superagent = require('superagent')
let cheerio = require('cheerio')
let eventproxy = require('eventproxy');
let url = require('url')
let async = require('async')

let cnodeUrl = 'https://cnodejs.org/';

// eventproxy 的实例
let ep = new eventproxy();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'express' })
});

// 爬虫JSON
router.get('/topic', function (req, res, next) {
  // var q = req.query
  // var md5Value = utility.md5(q)
  // res.render('index', { title: 'Express' });
  superagent.get(cnodeUrl)
    .end((err, sres) => {
      if (err) {
        return next(err)
      }
      // sres.text 里面存储着网页的 html 内容，将它传给 cheerio.load 之后
      // 就可以得到一个实现了 jquery 接口的变量，我们习惯性地将它命名为 `$`
      // 剩下就都是 jquery 的内容了
      let $ = cheerio.load(sres.text)
      let items = []
      $('#topic_list .topic_title').each((i, e) => {
        var $e = $(e)
        items.push(
          {
            title: $e.attr('title'),
            href: $e.attr('href')
          }
        )
      })
      res.json({
        message: 'ok',
        status: 0,
        data: items
      })
    })
});

// 异步爬虫
router.get('/comment', function (req, res, next) {
  superagent.get(cnodeUrl)
    .end((err, sres) => {
      if (err) {
        next(err)
      }
      let topicUrls = []
      let $ = cheerio.load(sres.text)
      $('#topic_list .topic_title').each((i, e) => {
        let $e = $(e)
        let href = url.resolve(cnodeUrl, $e.attr('href'))
        topicUrls.push(href)
      })

      // 得到 topicUrls 之后
      ep.after('topic_html', topicUrls.length, (topics) => {
        // topics 是个数组，包含了 40 次 ep.emit('topic_html', pair) 中的那 40 个 pair

        topics = topics.map(topicPair => {
          let topicHtml = topicPair[1]
          let $ = cheerio.load(topicHtml)

          return ({
            title: $('.topic_full_title').text().trim(),
            href: topicPair[0],
            comment0: $('.reply_content').eq(0).text().trim(), 
          })

        })

        res.send({
          status: 0,
          data: {
            topics
          },
          message: 'ok',
        })
      })

      topicUrls.forEach((topicUrl, i) => {
        superagent.get(topicUrl)
          .end((err, res) => {
            ep.emit('topic_html', [topicUrl, res.text])
          })
      })
    })
})

let fetchUrl = function (url, callback) {
  var delay = parseInt((Math.random() * 10000000) % 2000, 10);
  concurrencyCount++;
  console.log('现在的并发数是', concurrencyCount, '，正在抓取的是', url, '，耗时' + delay + '毫秒');
  setTimeout(function () {
    concurrencyCount--;
    callback(null, url + ' html content');
  }, delay);
};

// 异步控制并发数爬虫
// router.get('/async', function (req, res, next) {
//   superagent.get(cnodeUrl)
//     .end((err, sres) => {
//       if (err) {
//         next(err)
//       }
//       let topicUrls = []
//       let $ = cheerio.load(sres.text)
//       $('#topic_list .topic_title').each((i, e) => {
//         let $e = $(e)
//         let href = url.resolve(cnodeUrl, $e.attr('href'))
//         topicUrls.push(href)
//       })

//       // 得到 topicUrls 之后
//       async.mapLimit(topicUrls, 5, function (url, callback) {
//         fetchUrl(url, callback);
//       }, function (err, result) {
//         res.send({
//           status: 0,
//           data: {
//             result
//           },
//           message: 'ok',
//         })
//       });
//     })
// })

module.exports = router;
