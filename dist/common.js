"use strict";var __importDefault=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.getNews=exports.sleep=exports.UKRNET_SECTIONS=exports.OUTPUT_DIR=void 0;const moment_1=__importDefault(require("moment"));exports.OUTPUT_DIR="./output";const MESSAGES_MAX_COUNT=50,MAX_LENGTH={title:200,description:1e3};exports.UKRNET_SECTIONS=[{route:"main",longTitle:"Головні події України та світу"},{route:"russianaggression",longTitle:"Війна РФ проти України"},{route:"politics",longTitle:"Політичні новини країни"},{route:"economics",longTitle:"Економіка та бізнес"},{route:"criminal",longTitle:"Оперативно про надзвичайні події"},{route:"society",longTitle:"Соціальні та культурні події"},{route:"world",longTitle:"Ситуація в світі"},{route:"kyiv",longTitle:"Події в Києві та області"},{route:"dnipro",longTitle:"Події в Дніпрі та області"},{route:"zaporizhzhya",longTitle:"Події в Запоріжжі та області"},{route:"mikolayiv",longTitle:"Події в Миколаєві та області"},{route:"odesa",longTitle:"Події в Одесі та області"},{route:"kharkiv",longTitle:"Події в Харкові та області"},{route:"kherson",longTitle:"Події в Херсоні та області"},{route:"crimea",longTitle:"Події в Криму"},{route:"donetsk",longTitle:"Події в Донецьку та області"},{route:"luhansk",longTitle:"Події в Луганську та області"}];const sleep=t=>new Promise(e=>setTimeout(e,t));exports.sleep=sleep;const getNews=(l,e,t=MESSAGES_MAX_COUNT)=>{return e.slice(0,t).map(({Title:e="",Description:t="",DateCreated:o,NewsCount:i,NewsId:r})=>(void 0===l[r]&&(l[r]={title:e.substring(0,MAX_LENGTH.title),description:t.substring(0,MAX_LENGTH.description),created:moment_1.default(1e3*o).toISOString(),count:i}),r))};exports.getNews=getNews;