const fs = require('fs');
const get_data_from_path = require('./tools.js').get_data;
const choose_random_from = require('./tools.js').choose_random_from;
const nlp = require('natural');

let build_tagger = function(){
    let probable_lexicon_path = __dirname+"/node_modules/natural/lib/natural/brill_pos_tagger/data/English/lexicon_from_posjs.json";
    if(!fs.existsSync(probable_lexicon_path))console.log("Can't find lexicon file",probable_lexicon_path);
    let probable_ruleset_path = __dirname+"/node_modules/natural/lib/natural/brill_pos_tagger/data/English/tr_from_posjs.txt";
    if(!fs.existsSync(probable_ruleset_path))console.log("Can't find lexicon file",probable_ruleset_path);
    
    let lexicon = new nlp.Lexicon(probable_lexicon_path,"OTHER");
    let ruleSet = new nlp.RuleSet(probable_ruleset_path);
    let tagger = new nlp.BrillPOSTagger(lexicon, ruleSet);
    return tagger;
};

let data = get_data_from_path("./text/christmas_carol_dickens.txt");
let paragraphs = data.split("\r\n");
let one_paragraph = choose_random_from(paragraphs).trim();
//console.log(one_line);
let sentence = one_paragraph.split(' ').map(w=>w.replace(/\s"'/g,""));
let tagger = build_tagger();
//console.log(tagger.tag(sentence));

let model = {};

paragraphs.forEach(p=>{
    let lines = p.split(/[\.\!\?]"*/);
    lines.forEach(l=>{
        let line = l.split(' ').map(w=>w.replace(/\s"'/g,"")).filter(w=>w.length>0);
        if(line.length>0){
            let sentence = tagger.tag(line);
            let tags = sentence.taggedWords.map(t=>t.tag);
            tags.forEach((t,i)=>{
                if(i<tags.length-1){
                    let t2 = tags[i+1];
                    if(!model[t]) model[t]=[];
                    model[t].push(t2);
                }
            });
        }
    });
});

console.log(model);