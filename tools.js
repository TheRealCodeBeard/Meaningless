let clean_word = function(word){
    return word.trim().replace(/[\(\),";:“”]|--/g,"").toLowerCase();
};

let choose_random_from = function(arr){
    return arr[Math.floor(Math.random()*arr.length)]
};

module.exports = {
    clean_word:clean_word,
    choose_random_from:choose_random_from
};