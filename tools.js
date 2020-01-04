const fs = require('fs');

let clean_word = function(word){
    return word.trim().replace(/[\(\),";:“”]|--/g,"").toLowerCase();
};

let choose_random_from = function(arr){
    return arr[Math.floor(Math.random()*arr.length)]
};

let initial_cap = function(word){
    if(word){
        return word[0].toUpperCase() + word.slice(1);
    } else {
        return word;
    }
};

let shuffle = function (a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

let get_data = function(path){
    return fs.readFileSync(path,'utf8');
};

let get_data_from_folder = function(folder_path){
    let data = "";
    let paths_to_text = shuffle(fs.readdirSync(folder_path).filter(p=>p.match(/\.txt$/)));
    paths_to_text.forEach((p)=>{
        let path = folder_path+"/"+p;
        console.log(`Loading: ${path}`);
        data =data + get_data(path) +"\n";
    });
    return data;
};

module.exports = {
    clean_word:clean_word,
    choose_random_from:choose_random_from,
    initial_cap:initial_cap,
    shuffle:shuffle,
    get_data:get_data,
    get_data_from_folder:get_data_from_folder
};