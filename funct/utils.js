function md_to_html(text, content_path) {
    var html = text.replace(/\[\[(.*?)\]\]\((.*?)\)/gm, '<span class="md-link" onclick="load_content(\'$1\')">$2</span>');
    html = html.replace(/\/img\/(.*?)\//gm, '<img src="' + content_path + '$1" class="md-image" />');
    html = html.replace(/\<(wrapper|test)(.*?)(?:class=\"(.*?)\"|)\>/gm, '<div $2 class="$1 $3">');
    html = load_code_snippets(html);
    html = embed_files(html);
    html = marked.parse(html);
    return html;
}
function load_code_snippets(markdown) {
    var snippets_found = markdown.match(/\<{2}@code .*? .*?\>{2}/gm);
    if (snippets_found) {
        var snippet_index_1 = 0;
        snippets_found.forEach(function (snippet) {
            var tokens = snippet.match(/\<{2}(@code (.*?) (.*?))\>{2}/m);
            if (tokens.length === 4) {
                var id_1 = tokens[1].replace(/[\.\@\/\+ ]/gm, '-') + snippet_index_1++;
                var placeholder_wrapper = document.createElement('pre');
                placeholder_wrapper.classList.add('code-pre');
                var placeholder = document.createElement('code');
                placeholder.classList.add('language-' + tokens[2]);
                placeholder_wrapper.append(placeholder);
                placeholder.id = id_1;
                markdown = markdown.replace(tokens[0], placeholder_wrapper.outerHTML);
                fetch(content_path + tokens[3]).then(function (response) {
                    if (response.ok) {
                        response.text().then(function (code) {
                            var placeholder = document.querySelector('#' + id_1);
                            placeholder.innerHTML = hljs.highlight(code, { language: tokens[2] }).value;
                        });
                    }
                    else {
                        markdown = markdown.replace(tokens[1], 'Failed loading code snippet');
                    }
                });
            }
        });
    }
    return markdown;
}
function embed_files(markdown) {
    var includes_found = markdown.match(/\<{2}@include (.*?)\>{2}/gm);
    if (includes_found !== null) {
        var current_file_index = 0;
        includes_found.forEach(function (include) {
            var tokens = include.match(/@include (.*?)\>/m);
            if (tokens.length === 2) {
                var filename_1 = tokens[1];
                var id_2 = filename_1.replace(/[.\/]/g, '-');
                markdown = markdown.replace(/\<{2}@include.*?\>{2}/m, '<div class="placeholder" id="' + id_2 + '"></div>\n\n');
                fetch(content_path + filename_1).then(function (response) {
                    var placeholder = document.querySelector('.placeholder#' + id_2);
                    if (response.ok) {
                        response.text().then(function (txt) {
                            placeholder.classList.add('loaded');
                            var extension_arr = filename_1.match(/^.*?\.(.*?)$/m);
                            if (extension_arr && extension_arr.length == 2) {
                                var extension = extension_arr[1];
                                if (['png', 'jpg', 'svg'].indexOf(extension) !== -1) {
                                    var img_container = document.createElement('img');
                                    img_container.classList.add('md-image');
                                    img_container.src = content_path + filename_1;
                                    placeholder.append(img_container);
                                    placeholder.classList.add('full-size');
                                }
                                else if (['html', 'htm'].indexOf(extension) !== -1) {
                                    placeholder.innerHTML = txt;
                                    placeholder.classList.add('full-size');
                                }
                                else
                                    placeholder.textContent = txt;
                            }
                            else
                                placeholder.textContent = txt;
                        });
                    }
                    else {
                        placeholder.classList.toggle('failed', true);
                    }
                });
            }
        });
    }
    return markdown;
}
function initialize_wrappers() {
    var wrappers = content.querySelectorAll('div.wrapper');
    if (wrappers !== null) {
        wrappers.forEach(function (wrapper) {
            var toggler = document.createElement('div');
            toggler.classList.add('toggler');
            wrapper.prepend(toggler);
            wrapper.classList.add('extended');
            var name = wrapper.getAttribute('name');
            if (name !== null)
                toggler.innerHTML = name;
            toggler.setAttribute('calc-max-height', window.getComputedStyle(wrapper).height);
            toggler.setAttribute('toggler-height', window.getComputedStyle(toggler).height);
            toggler.addEventListener('click', function (evt) {
                var target = evt.currentTarget;
                target.parentElement.classList.toggle('extended');
                if (target.parentElement.classList.contains('extended')) {
                    target.parentElement.style.maxHeight = target.getAttribute('calc-max-height');
                    var transition_time = window.getComputedStyle(target.parentElement).transition.match(/(\d*)s/m)[1];
                    setTimeout(function () {
                        target.parentElement.style.maxHeight = "99999999999vh";
                        setTimeout(function () {
                            target.parentElement.style.maxHeight = window.getComputedStyle(target.parentElement).height;
                        }, 100);
                    }, parseInt(transition_time) * 1000);
                }
                else {
                    target.setAttribute('calc-max-height', window.getComputedStyle(target.parentElement).height);
                    target.parentElement.style.maxHeight = target.getAttribute('toggler-height');
                }
            });
            var is_closed = toggler.parentElement.getAttribute('closed');
            if (is_closed !== null && is_closed === 'true')
                toggler.click();
        });
    }
}
function highlight_code_snippets() {
    var code_snippets = document.querySelectorAll('[class^=language-]');
    code_snippets.forEach(function (snippet) {
        var language = snippet.className.match(/language-(.*?)(?=\ |$)/m)[1];
        try {
            snippet.innerHTML = hljs.highlight(snippet.innerHTML, { language: language }).value;
            snippet.parentElement.classList.add('code-pre');
            var lan_elem = document.createElement('div');
            lan_elem.innerHTML = language;
            lan_elem.classList.add('language');
            snippet.parentElement.append(lan_elem);
        }
        catch (_a) {
            console.log('Language ' + language + ' not supported');
        }
    });
}
//# sourceMappingURL=utils.js.map