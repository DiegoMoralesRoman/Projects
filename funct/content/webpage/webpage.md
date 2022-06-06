# Introduction
I've built this webpage as a means to document easily all the projects I've done over the years. The scope of this webpage is to allow me to write documentation without having to mess with HTML creating entries with a custom version of ```markdown```.

Also, all of this has to work with GitHub pages, so using backend for rendering was out of the question.
# Basic functionality
This webpage renders markdown files. Besides all markdown functionality it also has some custom tags  **(defined with ```<<@tag>>```)** that allow to include files, images, or organize content in a better way.

The engine used to render the base markdown implementation is [marked.js](https://marked.js.org).
## Import files 
Files can be included with the ```@include filename``` tag. Depending on the extension, the file will be treated differently. For example if there is an image extension, an image will be inserted, if it's HTML code, it will be rendered.

### Code inclusion
Although code can be rendered using backticks with the default markdown implementation, source files can also be included with the ```@code lang filename``` tag. 

For example:
```C++
#include <iostream>

int main() {
    std::cout << "Hello world!";
    return 0;
}
```
This code is higlighted automatically using the library [highlight.js](https://highlightjs.org).
