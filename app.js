const fs_promises = require('fs').promises;
const fs = require('fs');
console.log("Meanlinglessness");

let path_to_text = "./text/christmas_carol_dickens.txt";
let line_lengths_data = "./data/line_lengths.csv";
let simple_model_data = "./data/simple_model.json";
let names_data = "./data/names.txt"
let names_list = [];

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

let clean_word = function(word){
   return word.trim().replace(/[\(\),";:]|--/g,"").toLowerCase();
}

let line_lengths = function(data){
    let paragraphs = data.split(/\n/);
    let lengths = ["Characters,Character Bucket,Words,Word Bucket,Line"];
    let word_lengths = [];
    paragraphs.forEach(p=>{
        lines = p.split(/[.!?]"*/);
        lines.forEach(l=>{
            let line = l.trim();
            let char_len = line.length;
            if(char_len>0){
                let word_len = line.split(/\s/).length;
                word_lengths.push(word_len);
                lengths.push(`${char_len},${get_char_bucket(char_len)},${word_len},${get_word_bucket(word_len)},"${clean(line)}"`);
            }
        });
    });
    fs_promises.writeFile(line_lengths_data,lengths.join('\n'));
    return word_lengths.reduce((a, b) => a + b, 0)/word_lengths.length;
};

let simple_model = function(data){
    let model = {};
    let paragraphs = data.split(/\n/);
    let output_words = [];
    paragraphs.forEach(p=>{
        lines = p.split(/[.!?]"*/);
        lines.forEach(l=>{
            let line = l.trim();
            if(line.length>0){
                let words = line.split(/\s/).map(clean_word);
                words.map((w,i)=>{
                    if(i<words.length-1){
                        if(!output_words.includes(w)) output_words.push(w);
                        let w2 = words[i+1];
                        if(!model[w]) model[w]=[];
                        model[w].push(w2);
                    }
                });
            }
        });
    });
    fs_promises.writeFile(simple_model_data,JSON.stringify(model,null,2));
    return {model:model,words:output_words};
};

let initial_cap = function(word){
    return word[0].toUpperCase() + word.slice(1);
};

let adjust_word = function(word){
    console.log(names_list);
    if(names_list.contains(word)) word = initial_cap(word);
    return word;
};

let generate_sentence = function(model,first,avg_length){
    let word = first;
    let sentence = [];
    for(var i=0;i<=avg_length;i++){
        sentence.push(adjust_word(word));
        let following_words = model[word];
        if(following_words){
            word = model[word][Math.floor(Math.random()*following_words.length)];
        } else {
            word = first;
        }
    }
    console.log(sentence.join(' '));
};

let process_data = function(data){
    names_list =  fs.readFileSync(names_data,'utf8').split('\r\n');
    let average_line_word_length = line_lengths(data);
    let {model,words} = simple_model(data);
    for(var i =0;i<10;i++){
        generate_sentence(model,words[Math.floor(Math.random()*words.length)],Math.floor(average_line_word_length));
    }
};



get_data(path_to_text).then(process_data);
