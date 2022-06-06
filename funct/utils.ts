function md_to_html(text: string, content_path: string): string {
    // Links
    let html = text.replace(/\[\[(.*?)\]\]\((.*?)\)/gm, '<span class="md-link" onclick="load_content(\'$1\')">$2</span>');
    html = html.replace(/\/img\/(.*?)\//gm, '<img src="' + content_path + '$1" class="md-image" />');

    // Replace custom tags
    html = html.replace(/\<(wrapper|test)(.*?)(?:class=\"(.*?)\"|)\>/gm, '<div $2 class="$1 $3">');

    // Code snippets include
    html = load_code_snippets(html);

    // Include files
    html = embed_files(html);

    // Use merked library
    // @ts-expect-error
    html = marked.parse(html);

    return html;
}

// Markdown utility functions
function load_code_snippets(markdown: string): string {
    // Find code snippet tags in markdown
    const snippets_found = markdown.match(/\<{2}@code .*? .*?\>{2}/gm);
    if (snippets_found) { // If there are code tags
        let snippet_index = 0;
        // Load snippets independently
        snippets_found.forEach(snippet => {
            /**
             * Get tag arguments
             * Language (language to use for highlighting)
             * Filename (file to include)
             */
            const tokens = snippet.match(/\<{2}(@code (.*?) (.*?))\>{2}/m);

            // Only if it has enough arguments
            if (tokens.length === 4) { // All tokens available (language, filename)
                // Create placeholder
                const id = tokens[1].replace(/[\.\@\/\+ ]/gm, '-') + snippet_index++;
                const placeholder_wrapper = document.createElement('pre');
                placeholder_wrapper.classList.add('code-pre');
                const placeholder = document.createElement('code');
                placeholder.classList.add('language-' + tokens[2]);
                placeholder_wrapper.append(placeholder);
                placeholder.id = id;
                // Replace the @code tag for the generated html code (placeholder)
                markdown = markdown.replace(tokens[0], placeholder_wrapper.outerHTML);


                // Fetch source file
                fetch(content_path + tokens[3]).then(response => {
                    if (response.ok) { // If the file was found
                        // Load text
                        response.text().then(code => {
                            // Load code into placeholder
                            const placeholder = document.querySelector('#' + id);
                            // @ts-expect-error
                            placeholder.innerHTML = hljs.highlight(code, { language: tokens[2] }).value;
                        });
                    } else { // In case the file wasn't found display an error message
                        markdown = markdown.replace(tokens[1], 'Failed loading code snippet');
                    }
                });
            }
        });
    }

    return markdown;
}

function embed_files(markdown: string): string {
    // Search all file include tags
    const includes_found = markdown.match(/\<{2}@include (.*?)\>{2}/gm);
    if (includes_found !== null) { // If there are include tags
        let current_file_index = 0; // Used for creating unique tags
        includes_found.forEach(include => {
            // Get file from match
            /**
             * Get arguments from tag
             * filename: path of the file to include
             */
            const tokens = include.match(/@include (.*?)\>/m); 
            if (tokens.length === 2) {
                // Fetch file
                // Create placeholder
                const filename = tokens[1];
                const id = filename.replace(/[.\/]/g, '-'); // Clean illegal characters from id
                // Create placeholder element
                markdown = markdown.replace(/\<{2}@include.*?\>{2}/m, '<div class="placeholder" id="' + id + '"></div>\n\n');
                // Get file from server
                fetch(content_path + filename).then(response => {  
                    const placeholder = document.querySelector('.placeholder#' + id);
                    if (response.ok) {
                        // Set content of placholder to file
                        response.text().then(txt => {
                            placeholder.classList.add('loaded');
                            // Get file extension
                            const extension_arr = filename.match(/^.*?\.(.*?)$/m);
                            if (extension_arr && extension_arr.length == 2) {
                                const extension = extension_arr[1];
                                // Check extension for custom types
                                if (['png', 'jpg', 'svg'].indexOf(extension) !== -1) { // Check for image files
                                    const img_container = document.createElement('img');
                                    img_container.classList.add('md-image');
                                    img_container.src = content_path + filename;
                                    placeholder.append(img_container);
                                    placeholder.classList.add('full-size');
                                } else if (['html', 'htm'].indexOf(extension) !== -1) {
                                    placeholder.innerHTML = txt;
                                    placeholder.classList.add('full-size');
                                } else
                                    placeholder.textContent = txt;
                            } else
                                placeholder.textContent = txt;
                        });
                    } else {
                        placeholder.classList.toggle('failed', true);
                    }
                });
            }
        });
    }
    return markdown;
}

function initialize_wrappers() {
    const wrappers = content.querySelectorAll('div.wrapper');
    if (wrappers !== null) {
        wrappers.forEach(wrapper => {
            const toggler = document.createElement('div');
            toggler.classList.add('toggler');
            wrapper.prepend(toggler);
            wrapper.classList.add('extended');

            // Set name of toggler
            const name = wrapper.getAttribute('name');
            if (name !== null)
                toggler.innerHTML = name;

            toggler.setAttribute('calc-max-height', window.getComputedStyle(wrapper).height);
            toggler.setAttribute('toggler-height', window.getComputedStyle(toggler).height);

            toggler.addEventListener('click', evt => {
                const target = <HTMLElement>evt.currentTarget;
                target.parentElement.classList.toggle('extended');
                if (target.parentElement.classList.contains('extended')) {
                    target.parentElement.style.maxHeight = target.getAttribute('calc-max-height');
                    // Default to infinite max height after some time
                    const transition_time = window.getComputedStyle(target.parentElement).transition.match(/(\d*)s/m)[1];
                    setTimeout(() => {
                        target.parentElement.style.maxHeight = "99999999999vh";
                        // Shrink after some time
                        setTimeout(() => {
                            target.parentElement.style.maxHeight = window.getComputedStyle(target.parentElement).height;
                        }, 100);
                    }, parseInt(transition_time) * 1000);
                }
                else {
                    target.setAttribute('calc-max-height', window.getComputedStyle(target.parentElement).height);
                    target.parentElement.style.maxHeight = target.getAttribute('toggler-height');
                }

            });
            const is_closed = toggler.parentElement.getAttribute('closed');
            if (is_closed !== null && is_closed === 'true')
                toggler.click();

        });
    }
}

function highlight_code_snippets() {
    const code_snippets = document.querySelectorAll('[class^=language-]');
    code_snippets.forEach(snippet => {
        const language = snippet.className.match(/language-(.*?)(?=\ |$)/m)[1];
        try {
            // @ts-expect-error
            snippet.innerHTML = hljs.highlight(snippet.innerHTML, { language: language }).value;
            snippet.parentElement.classList.add('code-pre');
            const lan_elem = document.createElement('div');
            lan_elem.innerHTML = language;
            lan_elem.classList.add('language');
            snippet.parentElement.append(lan_elem);
        } catch {
            console.log('Language ' + language + ' not supported');
        }
    });
}