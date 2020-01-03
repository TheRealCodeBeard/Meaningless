const fs_promises = require('fs').promises;
console.log("Meanlinglessness");

let path_to_text = "./text/christmas_carol_dickens.txt";
let line_lengths_data = "./data/line_lengths.csv";

let get_data = async function(path){
    return await fs_promises.readFile(path,'utf8');
};

let get_char_bucket = function(len){
    if(len<=010) return "000-010";
    if(len<=025) return "011-025";
    if(len<=050) return "026-050";
    if(len<=075) return "051-075";
    if(len<=100) return "076-010";
    if(len<=125) return "101-125";
    if(len<=150) return "126-150";
    if(len<=175) return "151-175";
    if(len<=200) return "176-200";
    if(len<=225) return "201-225";
    if(len<=250) return "226-250";
    if(len<=275) return "251-275";
    return "more";
};

let get_word_bucket = function(len){
    if(len<=02) return "000-002";
    if(len<=05) return "003-005";
    if(len<=08) return "006-008";
    if(len<=10) return "009-010";
    if(len<=15) return "011-015";
    if(len<=20) return "016-020";
    if(len<=25) return "021-025";
    if(len<=30) return "026-030";
    if(len<=35) return "031-035";
    if(len<=40) return "036-040";
    if(len<=45) return "041-045";
    if(len<=50) return "046-050";
    if(len<=55) return "051-055";
    if(len<=60) return "056-060";
    return "more";
};

let clean = function(line){
    return line.replace(/"/g,"'");
};

let line_lengths = function(data){
    let paragraphs = data.split(/\n/);
    let lengths = ["Characters,Character Bucket,Words,Word Bucket,Line"];
    paragraphs.forEach(p=>{
        lines = p.split(/[.!?]"*/)
        lines.forEach(l=>{
            let line = l.trim();
            let char_len = line.length;
            if(char_len>0){
                let word_len = line.split(/\s/).length;
                lengths.push(`${char_len},${get_char_bucket(char_len)},${word_len},${get_word_bucket(word_len)},"${clean(line)}"`);
            }
        });
    });
    fs_promises.writeFile(line_lengths_data,lengths.join('\n'));
};

let process_data = function(data){
    line_lengths(data);
};

get_data(path_to_text).then(process_data);
