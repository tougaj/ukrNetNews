"use strict";var __awaiter=this&&this.__awaiter||function(e,s,l,a){return new(l=l||Promise)(function(o,t){function r(e){try{n(a.next(e))}catch(e){t(e)}}function i(e){try{n(a.throw(e))}catch(e){t(e)}}function n(e){var t;e.done?o(e.value):((t=e.value)instanceof l?t:new l(function(e){e(t)})).then(r,i)}n((a=a.apply(e,s||[])).next())})},__importDefault=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(exports,"__esModule",{value:!0});const fs_1=__importDefault(require("fs")),moment_1=__importDefault(require("moment")),puppeteer_1=__importDefault(require("puppeteer")),common_1=require("./common"),TIMEOUT_BETWEEN_SESSIONS=3e5,browserOptions={width:800,height:600};fs_1.default.existsSync(common_1.OUTPUT_DIR)||fs_1.default.mkdirSync(common_1.OUTPUT_DIR);const argv=require("yargs").usage("Usage: node ./dist/$0 -p [str]").string(["p"]).alias("p","proxy").nargs("p",1).describe("p","Proxy configuration in format http://login:password@address:port/").help("h").alias("h","help").argv,proxyAddress=argv.proxy||"",init=()=>__awaiter(void 0,void 0,void 0,function*(){const e=yield puppeteer_1.default.launch({headless:!1,ignoreHTTPSErrors:!0,args:[`--window-size=${browserOptions.width},${browserOptions.height}`,`--proxy-server=${proxyAddress}`]}),t=(yield e.pages())[0];return yield t.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36"),yield t.setViewport({width:browserOptions.width-45,height:browserOptions.height,deviceScaleFactor:1}),yield t.goto("https://www.ukr.net/"),yield t.waitForSelector("body"),{browser:e,page:t}}),loadUkrNetNews=(n,s,{route:l,longTitle:a})=>__awaiter(void 0,void 0,void 0,function*(){var t=`https://www.ukr.net/news/dat/${l}/0/`;try{yield n.goto(t),yield n.waitForSelector("body");var e=yield n.$("body pre"),o=yield n.evaluate(e=>e.textContent,e),{tops:r,Title:i}=JSON.parse(o);return console.log(`✅ ${i} (${l}) loaded`),{route:l,title:i,longTitle:a,tops:common_1.getNews(s,r)}}catch(e){return console.log(`❌ !!! ERROR !!! ${l} not loaded from url: ${t} with error: ${e}`),null}}),loadAllNews=n=>__awaiter(void 0,void 0,void 0,function*(){var t={};const o=[];for(let e=0;e<common_1.UKRNET_SECTIONS.length;e++){0!==e&&(i=Math.round(100+1e3*Math.random()),yield common_1.sleep(i));var{route:r,longTitle:i}=common_1.UKRNET_SECTIONS[e];o.push(yield loadUkrNetNews(n,t,{route:r,longTitle:i}))}var e={created:moment_1.default().toISOString(),news:o.filter(e=>null!==e),messages:t},e=JSON.stringify(e,null,"\t");fs_1.default.writeFileSync(`${common_1.OUTPUT_DIR}/ukrnet.json`,e)});__awaiter(void 0,void 0,void 0,function*(){let{browser:e,page:t}=yield init();for(;;){console.log("\nNews loading start at "+moment_1.default().format("HH:mm:ss"));try{e.isConnected()||({browser:e,page:t}=yield init()),yield loadAllNews(t),console.log("🟢 News loaded at "+moment_1.default().format("HH:mm:ss"))}catch(e){console.log(`🔴 Error loading news ${e}`)}console.log(`⏰  Next run at ${moment_1.default().add(TIMEOUT_BETWEEN_SESSIONS,"ms").format("HH:mm:ss")}`),yield common_1.sleep(TIMEOUT_BETWEEN_SESSIONS)}yield e.close()});