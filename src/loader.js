'use strict';

const fetch = require('node-fetch');
const fs = require('fs');

fetch('https://www.ukr.net/news/dat/main/0/')
    .then(data => data.json())
    .then(json => {
        // let tops = json.tops.slice(0, 2);
        let tops = json.tops;
        let sTops = JSON.stringify(tops);
        fs.writeFileSync('ukr_net_tops.json', sTops)
    })
    .catch(error => console.error(error));