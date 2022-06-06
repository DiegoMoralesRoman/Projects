# Esto es un archivo de pruebas
<<@include pruebas/pruebas.html>>

# Ahora con una tabla del propio markdown

| Kekos   | Indie |
|---------|-------|
| Perlita | Valor |

## Prueba con código
<wrapper name="Código" closed="true">

### Archivo importado
<<@code C++ pruebas/file.cpp>>
### Archivo dentro de markdown
Prueba metiendo el archivo directamente dentro del markdown

```C++
#include <iostream>

int main() {
    std::cout << "Hola mundo\n";
    return 0;
}
```
</wrapper>

