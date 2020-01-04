const fs_promises = require('fs').promises;
const fs = require('fs');
const nlp = require('natural');
const thesaurus = require('./thesaurus.js');
let Sentiment_Analyzer = require('natural').SentimentAnalyzer;
let stemmer = require('natural').PorterStemmer;
let sentiment_analyzer = new Sentiment_Analyzer("English", stemmer, "afinn");
console.log("Meanlinglessness\n----------------------------\n");

let path_to_text = "./text/christmas_carol_dickens.txt";
let path_to_thesaurus = "./text/th_en_US_new.dat";
let paths_to_text = [
    "./text/christmas_carol_dickens.txt",
    //"./text/the_raven_poe.txt",
    //"./text/the_wendigo_blackwood.txt",
    //"./text/poems_wordsworth.txt",
    //"./text/the_rats_in_the_walls_lovecraft.txt",
    //"./text/the_strange_case_of_dr_jekyll_and_mr_hyde_stevenson.txt",
    //"./text/anthem_rand.txt",
    //"./text/the_three_strangers_hardy.txt"
];
let line_lengths_data = "./data/line_lengths.csv";
let simple_model_data = "./data/simple_model.json";
let names_data = "./data/names.txt"
let names_list = [];

let get_sentiment = function(sentence){
    return sentiment_analyzer.getSentiment(sentence.split(' '));
};

let get_data = function(path){
    return fs.readFileSync(path,'utf8');
};

let shuffle = function (a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
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
   return word.trim().replace(/[\(\),";:“”]|--/g,"").toLowerCase();
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
    if(word){
        return word[0].toUpperCase() + word.slice(1);
    } else {
        return word;
    }
};

let adjust_word = function(word){
    let tested = word.replace(/'s/,"");
    if(names_list.includes(tested) 
        || word ==="i") word = initial_cap(word);
    return word;
};

let generate_sentence = function(model,first,avg_length,terminator){
    let sentence = [initial_cap(first)];
    let word = first;
    let actual_length = Math.floor((avg_length*0.5) + Math.random()*(avg_length*0.75));
    for(var i=0;i<=actual_length;i++){
        let following_words = model[word];
        if(following_words){
            word = model[word][Math.floor(Math.random()*following_words.length)];
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
    let final = sentence.join(' ')+terminator.trim();
    console.log(final);
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

let get_synonyms = function(w,additional){
    let synonyms = thesaurus.get_synonyms(w);
    synonyms = synonyms.filter(w=>!w.match(/\s/));
    synonyms = shuffle(synonyms);
    synonyms = synonyms.slice(0,additional);
    if(!synonyms.includes(w))synonyms.push(w);
    return synonyms.flat(1);
};

let process_data = function(data){
    thesaurus.load(path_to_thesaurus);
    names_list =  fs.readFileSync(names_data,'utf8').split('\r\n');
    let average_line_word_length = line_lengths(data);
    console.log(`Average line length ${Math.floor(average_line_word_length)}\n--------------------------------`);
    let {model,words} = simple_model(data);
    for(var i =0;i<10;i++){
        generate_sentence(model,words[Math.floor(Math.random()*words.length)],Math.floor(average_line_word_length),".");
    }
    console.log("\n----------------------------\n");
    let trigger_phrase = "Wonderful turkey";
    console.log(`(Trigger Phrase: ${trigger_phrase})`);
    let trigger_words = trigger_phrase.split(' ').map((w)=>get_synonyms(w,3)).flat(1);
    console.log(trigger_words);
    let len = Math.floor(average_line_word_length/2);
    let fragments = trigger_words.map((w)=>{
        if(model[w]) return generate_sentence(model,w,len,"");
        else return generate_sentence(model,closest_word(words,w),len,"");
    });
    console.log("\n----------------------------\nDone!");
};

let data = "";
paths_to_text.forEach((p)=>{
    data =data + get_data(p) +"\n";
});
process_data(data);