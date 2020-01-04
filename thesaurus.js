let fs = require('fs');
let thesaurus = {};

let load = function(path_to_thesaurus){
    let th_d = fs.readFileSync(path_to_thesaurus,'utf8');
    let lines = th_d.split('\n');
    let last_main_word = null;
    lines.forEach((l)=>{
        if(l==="ISO8859-1"){}
        else if(l.match(/^\(/)) {
            if(last_main_word) {
                l.split('|').slice(1).forEach((w)=>{
                    thesaurus[last_main_word].push(w);
                });
            }
        } else if(l.match(/^[^\(]+/)) {
            last_main_word = l.split('|')[0];
            thesaurus[last_main_word]=[last_main_word];
        }
    });
    console.log(`Thesaurus loaded: ${Object.keys(thesaurus).length}`);
};

let get_synonyms = function(word){
    let synonyms = [];
    let w = word.toLowerCase();
    if(thesaurus[w]) synonyms = thesaurus[w];
    return synonyms;
};

module.exports = {
    load:load,
    get_synonyms:get_synonyms
};