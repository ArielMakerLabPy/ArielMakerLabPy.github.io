# Especificación — Juego "Laboratorio FRX interactivo"

Documento de diseño del mini-juego que se agrega a la landing page.
Sirve como referencia para entender y mantener el código.

## Idea general

Un equipo de **Fluorescencia de Rayos X (FRX / XRF)** mide la composición
elemental de un material. En la práctica los resultados se reportan como
**óxidos** (es más fácil trabajar con ellos). El juego deja que el visitante
"dibuje" una muestra: clickea en cada columna del gráfico para fijar la
**altura** de cada óxido (= su concentración), y al analizar, el motor le dice
**a qué material(es) reales se parece** su mezcla.

- **Eje horizontal (X):** los óxidos que mide el FRX.
- **Eje vertical (Y):** la altura de cada barra = concentración del óxido (0–100 %).
- **Acción:** el usuario fija varias barras y presiona "Analizar muestra".
- **Resultado:** ranking de materiales con su probabilidad de coincidencia.

## Eje horizontal — 12 óxidos

```
SiO₂  Al₂O₃  Fe₂O₃  CaO  MgO  K₂O  Na₂O  TiO₂  MnO  P₂O₅  SO₃  ZrO₂
```

> En pantallas chicas (< 600px) las barras se angostan y la fórmula se rota
> para que entren las 12 columnas.

## Eje vertical — concentración

Cada barra va de 0 a 100 %. Antes de comparar, el perfil del usuario se
**normaliza** (la suma de todas las barras se lleva a 100 %), así no importa si
no llega justo a 100.

## Huellas de referencia (set industrial)

Valores aproximados en % en peso (didácticos, no de laboratorio). Esta tabla es
el corazón del juego: contra ella se compara lo que dibuja el usuario.

| Material            | SiO₂ | Al₂O₃ | Fe₂O₃ | CaO | MgO | K₂O | Na₂O | TiO₂ | MnO | P₂O₅ | SO₃ | ZrO₂ |
|---------------------|------|-------|-------|-----|-----|-----|------|------|-----|------|-----|------|
| Cemento Portland    | 21   | 5     | 3     | 64  | 2   | 0.5 | 0.2  | 0.3  | 0.1 | 0.1  | 3   | 0    |
| Vidrio sodocálcico  | 72   | 1.5   | 0.1   | 9   | 4   | 0.5 | 13   | 0    | 0   | 0    | 0.2 | 0    |
| Caliza (CaCO₃)      | 3    | 1     | 0.5   | 53  | 1   | 0.2 | 0.1  | 0    | 0   | 0    | 0.1 | 0    |
| Arcilla caolinítica | 47   | 38    | 1     | 0.2 | 0.3 | 1   | 0.2  | 1.5  | 0   | 0.2  | 0   | 0    |
| Basalto             | 49   | 15    | 12    | 9   | 7   | 1   | 3    | 2    | 0.2 | 0.3  | 0   | 0    |
| Escoria alto horno  | 35   | 12    | 0.5   | 40  | 8   | 0.5 | 0.3  | 0.5  | 0.5 | 0    | 2   | 0    |
| Arena sílice        | 96   | 1.5   | 0.3   | 0.1 | 0   | 0.3 | 0.1  | 0.1  | 0   | 0    | 0   | 0.3  |
| Yeso (CaSO₄·2H₂O)   | 2    | 0.5   | 0.2   | 32  | 0.5 | 0   | 0    | 0    | 0   | 0    | 46  | 0    |

## Motor de coincidencia (matching)

JS puro, sin librerías:

1. **Vector del usuario** `u` = las 12 alturas, normalizadas a suma 1.
2. **Cada material** `m` = su fila normalizada a suma 1.
3. **Similitud coseno:** `sim = (u·m) / (|u|·|m|)` → valor entre 0 y 1.
   Se usa coseno (no distancia euclidiana) porque compara la *forma* del perfil,
   no la magnitud absoluta.
4. **Ranking:** ordenar por `sim` descendente y mostrar el top 3 como porcentaje.
5. Si el mejor resultado es bajo (< 60 %), se muestra "Mezcla no identificada —
   ¿material compuesto?" (las muestras reales suelen ser mezclas).

```js
function cosine(u, m) {
  let dot = 0, nu = 0, nm = 0;
  for (let i = 0; i < u.length; i++) {
    dot += u[i] * m[i]; nu += u[i] * u[i]; nm += m[i] * m[i];
  }
  return nu && nm ? dot / (Math.sqrt(nu) * Math.sqrt(nm)) : 0;
}
```

## Dónde vive el código

- **HTML** (`index.html`): sección `<section id="lab-game">` entre el hero y el
  about, con un cartel que aclara que es un juego, un `<canvas>`, los botones
  *Analizar muestra* / *Reiniciar* y un panel de resultados.
- **CSS** (`assets/style.css`): bloque `/* ── LAB GAME ── */`, reusa los colores
  y fuentes del tema actual.
- **JS** (`assets/javascript.js`): módulo 8 `initLabGame()` siguiendo el patrón
  de los otros módulos. Dibuja las barras, maneja el click/hover y corre el
  motor de coincidencia.
- **Navbar**: enlace "Lab" que ancla a `#lab-game`.

## Cómo se juega

1. Click (o tap) sobre una columna → la barra sube hasta la altura del cursor.
2. Repetir en varias columnas para "componer" la muestra.
3. Presionar **Analizar muestra** → aparece el ranking de materiales probables.
4. **Reiniciar** vuelve todo a cero.
