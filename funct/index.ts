const content : HTMLElement = document.querySelector('#content');
const loader : HTMLElement = document.querySelector('#main-loader');

/// <reference path="utils.ts"/>

const content_path = './funct/content/';

let current_content = '';
function load_content(name : string) {
    // Only load if is different content
    if (current_content === name)
        return;
    current_content = name;

    loader.classList.toggle('hidden', false);
    // Check if content is already on caché 
    const response = fetch(content_path + name + '.md');
    response.then(value => {
        if (value.ok) {
            content.innerHTML = '';
            // Keep page for later use
            localStorage.setItem('last_content', name);

            value.text().then(txt => {
                // Load text into content box
                content.innerHTML = md_to_html(txt + '\n\n', content_path);
                // Preload all links referenced on page
                const links = content.querySelectorAll('span.md-link');
                links.forEach(elem => {
                    const content_name = elem.getAttribute('onclick').replace(/load_content\(\'(.*?)\'\)/, '$1');
                    console.log("Preloading content: " + content_name);
                    fetch(content_path + content_name + '.md');
                });
                loader.classList.toggle('hidden', true);

                // Highlight all code snippets
                highlight_code_snippets();

                // Initialize custom tags
                // Wrapper
                initialize_wrappers();
            });
        } else {
            alert("Content not found");
            loader.classList.toggle('hidden', true);
        }
    });
}

// Load previous page
if (localStorage.getItem('last_content') !== null)
    load_content(localStorage.getItem('last_content'));
else
    load_content('main');

// Load links
const links_container = document.querySelector('.bar .links');
fetch(content_path + 'links.json').then(response => {
    if (response.ok) {
        links_container.innerHTML = '';
        response.json().then(links => {
            for (let link in links) {
                const entry = document.createElement('p');
                entry.setAttribute('onclick', 'load_content("' + links[link] + '")');
                entry.innerText = link;
                links_container.append(entry);
            }
            // Store html
            localStorage.setItem('links', links_container.innerHTML);
        });
    } else {
        console.log('Failed loading links');
    }
});
// Load links until new links are found
if (localStorage.getItem('links') !== null) {
    links_container.innerHTML = localStorage.getItem('links');
}
