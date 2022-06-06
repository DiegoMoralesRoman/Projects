var content = document.querySelector('#content');
var loader = document.querySelector('#main-loader');
var content_path = './funct/content/';
var current_content = '';
function load_content(name) {
    if (current_content === name)
        return;
    current_content = name;
    loader.classList.toggle('hidden', false);
    var response = fetch(content_path + name + '.md');
    response.then(function (value) {
        if (value.ok) {
            content.innerHTML = '';
            localStorage.setItem('last_content', name);
            value.text().then(function (txt) {
                content.innerHTML = md_to_html(txt + '\n\n', content_path);
                var links = content.querySelectorAll('span.md-link');
                links.forEach(function (elem) {
                    var content_name = elem.getAttribute('onclick').replace(/load_content\(\'(.*?)\'\)/, '$1');
                    console.log("Preloading content: " + content_name);
                    fetch(content_path + content_name + '.md');
                });
                loader.classList.toggle('hidden', true);
                highlight_code_snippets();
                initialize_wrappers();
            });
        }
        else {
            alert("Content not found");
            loader.classList.toggle('hidden', true);
        }
    });
}
if (localStorage.getItem('last_content') !== null)
    load_content(localStorage.getItem('last_content'));
else
    load_content('main');
var links_container = document.querySelector('.bar .links');
fetch(content_path + 'links.json').then(function (response) {
    if (response.ok) {
        links_container.innerHTML = '';
        response.json().then(function (links) {
            for (var link in links) {
                var entry = document.createElement('p');
                entry.setAttribute('onclick', 'load_content("' + links[link] + '")');
                entry.innerText = link;
                links_container.append(entry);
            }
            localStorage.setItem('links', links_container.innerHTML);
        });
    }
    else {
        console.log('Failed loading links');
    }
});
if (localStorage.getItem('links') !== null) {
    links_container.innerHTML = localStorage.getItem('links');
}
//# sourceMappingURL=index.js.map