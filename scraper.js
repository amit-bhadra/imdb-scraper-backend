const fetch = require('node-fetch');
const cheerio = require('cheerio');

const url = 'https://www.imdb.com/find?ref_=nv_sr_fn&s=tt&q=';
const movieUrl = 'https://www.imdb.com/title/';

const searchCache = {};
const movieCache = {};

function searchMovies(searchTerm) {
    if(searchCache[searchTerm]) {
        console.log('Throwing from cache:', searchTerm);
        return Promise.resolve(searchCache[searchTerm]);
    }

    return fetch(`${url}${searchTerm}`)
        .then(response => response.text())
        .then(body => {
            const movies = [];
            const $ = cheerio.load(body);
            $('.findResult').each(function(i, element) {
                const $element = $(element);
                const $image = $element.find('td a img');
                const $title = $element.find('.result_text a');
                const imdbID = $title.attr('href').match(/title\/(.*)\//)[1];

                const movie = {
                    image: $image.attr('src'),
                    title: $title.text(),
                    imdbID
                };
                movies.push(movie);
            });

            searchCache[searchTerm] = movies;
            return movies;
        });
}

function getMovie(imdbID) {
    if(movieCache[imdbID]) {
        console.log('Throwing from cache:', imdbID);
        return Promise.resolve(movieCache[imdbID]);
    }

    return fetch(`${movieUrl}${imdbID}`)
        .then(response => response.text())
        .then(body => {
            const $ = cheerio.load(body);
            const $title = $('.title_wrapper h1');
            
            const title = $title.first().contents().filter(function() {
                return this.type == 'text';
            }).text().trim();

            const runTime = $('.subtext time').text().trim();

            const genre = $("#titleStoryLine > div:nth-child(10)")
                            .find("a")
                            .text()
                            .trim()
                            .split(" ");
            
            const releaseDate = $('#titleDetails > div:nth-child(6)')
                                .clone()    //clone the element
                                .children() //select all the children
                                .remove()   //remove all the children
                                .end()  //again go back to selected element
                                .text()
                                .trim();

            const imdbRating = $('span[itemprop="ratingValue"]').text();
            const poster = $('div.poster a img').attr('src');
            const summary = $('div.summary_text').text().trim();
            const director = $('div.credit_summary_item a').first().text().trim();
            const boxOffice = $('#titleDetails > div:nth-child(12)')
                                .clone()    //clone the element
                                .children() //select all the children
                                .remove()   //remove all the children
                                .end()  //again go back to selected element
                                .text()
                                .trim();

            const movie = {
                imdbID,
                title,
                runTime,
                genre,
                releaseDate,
                imdbRating,
                poster,
                summary,
                director,
                boxOffice
            };

            movieCache[imdbID] = movie;

            return movie;
        });
}

module.exports = {
    searchMovies,
    getMovie
};