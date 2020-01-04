const fs = require('fs');
const clean_word = require('./tools.js').clean_word;

let simple_markov_model = function(data){
    let model = {};
    let paragraphs = data.split(/\n/);
    paragraphs.forEach(p=>{
        lines = p.split(/[.!?]"*/);
        lines.forEach(l=>{
            let line = l.trim();
            if(line.length>0){
                let words = line.split(/\s/).map(clean_word);
                words.forEach((w,i)=>{
                    if(i<words.length-1){
                        let w2 = words[i+1];
                        if(!model[w]) model[w]=[];
                        model[w].push(w2);
                    }
                });
            }
        });
    });
    return model;
};

let save_model = function(model,path){
    fs.writeFileSync(path,JSON.stringify(model,null,2));
};

let load_model = function(path){
    return JSON.parse(fs.readFileSync(path));
};

module.exports = {
    simple_markov_model:simple_markov_model,
    save_model:save_model,
    load_model:load_model
};