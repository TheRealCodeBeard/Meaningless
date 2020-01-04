const get_data_from_path = require('./tools.js').get_data;
const choose_random_from = require('./tools.js').choose_random_from;

let data = get_data_from_path("./text/christmas_carol_dickens.txt");
let lines = data.split("\r\n");
let one_line = choose_random_from(lines);

console.log(one_line);