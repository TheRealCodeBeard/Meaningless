const fs = require('fs');
const nlp = require('natural');
const thesaurus = require('./thesaurus.js');
const models = require('./models.js');

const initial_cap = require('./tools.js').initial_cap;
const shuffle = require('./tools.js').shuffle;
const get_data_from_folder = require('./tools.js').get_data_from_folder;
const get_data_from_path = require('./tools.js').get_data;
const choose_random_from = require('./tools.js').choose_random_from;

let Sentiment_Analyzer = require('natural').SentimentAnalyzer;
let stemmer = require('natural').PorterStemmer;
let sentiment_analyzer = new Sentiment_Analyzer("English", stemmer, "afinn");

let path_to_thesaurus = "./text/th_en_US_new.dat";
let path_to_data = "./text";
let line_lengths_data = "./data/line_lengths.csv";
let path_to_model = "./data/simple_model.json";
let names_data = "./data/names.txt"
let names_list = [];

let get_sentiment = function(sentence){
    return sentiment_analyzer.getSentiment(sentence.split(' '));
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
    let lengths = ["Paragraph,Characters,Character Bucket,Words,Word Bucket,Sentiment,Line"];
    let word_lengths = [];
    let paragraph = 1;
    paragraphs.forEach(p=>{
        lines = p.split(/[.!?]"*/);
        lines.forEach(l=>{
            let line = l.trim();
            let sentimennt = get_sentiment(line);
            let char_len = line.length;
            if(char_len>0){
                let word_len = line.split(/\s/).length;
                word_lengths.push(word_len);
                lengths.push(`${paragraph},${char_len},${get_char_bucket(char_len)},${word_len},${get_word_bucket(word_len)},${sentimennt},"${clean(line)}"`);
            }
        });
        paragraph +=1;
    });
    fs.writeFileSync(line_lengths_data,lengths.join('\n'));
    return word_lengths.reduce((a, b) => a + b, 0)/word_lengths.length;
};

let adjust_word = function(word){
    let tested = word.replace(/'s/,"");
    if(names_list.includes(tested) 
        || word ==="i") word = initial_cap(word);
    return word;
};

let generate_sentence = function(model,first,avg_length,terminator){
    let sentence = [adjust_word(first)];
    let word = first;
    let actual_length = Math.floor((avg_length*0.5) + Math.random()*(avg_length*0.75));
    for(var i=0;i<=actual_length;i++){
        let following_words = model[word];
        if(following_words){
            word = choose_random_from(model[word]);
        } else {
            word = first;
        }
        sentence.push(adjust_word(word));
    }
    let unacceptable_ends = ["a","and","the","at","to","as","of",
                            "who","which","in","he","or","but","than",
                            "that","their","from"];
    for(var i=0;i<5;i++){
        if(unacceptable_ends.includes(sentence[sentence.length-1]))sentence.pop();
    }
    let final = sentence.join(' ').trim()+terminator;
    return final;
};

let closest_word = function(words,otherWord){
    let scores = words.map((w)=>{
        return {
            word:w,
            distance:nlp.LevenshteinDistance(w,otherWord)
        }
    });
    scores = scores.sort((a,b)=>a.distance-b.distance);
    return scores[0].word;
};

let generate_general_sentences = function(model,words,len){
    for(var i =0;i<10;i++){
        let sentence = generate_sentence(model,choose_random_from(words),len,".");
        console.log(initial_cap(sentence));
    }
};

let generate_triggered_sentences = function(trigger_phrase,model,words,len){
    let get_synonyms = function(w,additional){
        let synonyms = thesaurus.get_synonyms(w);
        synonyms = synonyms.filter(w=>!w.match(/\s/));
        synonyms = shuffle(synonyms);
        synonyms = synonyms.slice(0,additional);
        if(!synonyms.includes(w))synonyms.push(w);
        return synonyms.flat(1);
    };
    console.log(`(Trigger Phrase: ${trigger_phrase})`);
    let trigger_words = trigger_phrase.split(' ').map((w)=>get_synonyms(w,3)).flat(1);
    //console.log(trigger_words);
    len = Math.floor(len/2);
    let fragments = trigger_words.map((w)=>{
        if(model[w]) return generate_sentence(model,w,len,"");
        else return generate_sentence(model,closest_word(words,w),len,"");
    });
    console.log(initial_cap(fragments.join(' '))+".");
};

let get_model = function(load,model_path,data){
    if(load) {
        console.log("Loading model...");
        return models.load_model(model_path);
    } else {
        console.log("Loading Text Data...");
        console.log("Building model...");
        let model = models.simple_markov_model(data);
        models.save_model(model,model_path);
        return model;
    }
};

let process_model = function(model,average_line_word_length){
    console.log(`Average line length ${Math.floor(average_line_word_length)}\n--------------------------------`);
    let words = Object.getOwnPropertyNames(model);
    generate_general_sentences(model,words,Math.floor(average_line_word_length));
    console.log("----------------------------");
    let trigger_phrase = "Wonderful turkey";
    generate_triggered_sentences(trigger_phrase,model,words,Math.floor(average_line_word_length));
    console.log("----------------------------\nDone!");
};

console.log("----------------------------\n     |Meanlinglessness|\n----------------------------");
console.log("Loading Thesaurus...");
thesaurus.load(path_to_thesaurus);
console.log("Loading Names List...");
names_list =  get_data_from_path(names_data).split('\r\n');
console.log("----------------------------");
let load_model = true;
let data = load_model?null:get_data_from_folder(path_to_data);
let average_line_word_length = load_model?10:line_lengths(data);
let model = get_model(load_model,path_to_model,data);
process_model(model,average_line_word_length);