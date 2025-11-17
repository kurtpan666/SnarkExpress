# Math Rendering Support

Snark Express now supports LaTeX math formulas in paper abstracts using KaTeX.

## Supported Syntax

### Inline Math

Use `$...$` or `\(...\)` for inline formulas:

```
The complexity is $O(n^2)$ which is optimal.
The proof uses \(a^2 + b^2 = c^2\).
```

### Display Math

Use `$$...$$` or `\[...\]` for display formulas:

```
$$
E = mc^2
$$

\[
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
\]
```

## Examples

### Inline Math
- **Input**: `Let $f(x) = x^2 + 2x + 1$ be a polynomial.`
- **Renders as**: Let f(x) = x² + 2x + 1 be a polynomial.

### Display Math
- **Input**:
  ```
  The solution is given by:
  $$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$
  ```
- **Renders as**:
  ```
  The solution is given by:

  x = (-b ± √(b² - 4ac)) / 2a
  ```

### Cryptography Formulas

Common cryptography notation works seamlessly:

```
We use the cyclic group $\mathbb{G}$ of prime order $p$.

The prover computes:
$$\pi = g^{r_1} \cdot h^{r_2} \mod p$$

Security holds under the $q$-SDH assumption in $\mathbb{G}_1$.
```

## Abstract Extraction

Abstracts are extracted from ePrint IACR papers and automatically rendered with math support:

1. **ePrint IACR**: Extracts from meta tags or definition lists
2. **arXiv**: Extracts from arXiv API
3. **DOI/Other**: Extracts from meta tags or page content

All extracted abstracts preserve LaTeX notation and render it properly.

## Technical Details

- **Library**: KaTeX v0.16.9
- **Component**: `MathText.tsx`
- **Error Handling**: Invalid LaTeX syntax falls back to original text
- **Performance**: Client-side rendering with caching

## Troubleshooting

### Math not rendering?

1. **Check notation**: Make sure formulas are wrapped in `$...$` or `$$...$$`
2. **Verify syntax**: Use valid LaTeX commands
3. **Escape special chars**: Use `\$` for literal dollar signs

### Common LaTeX Commands

These work out of the box:
- Superscript: `x^2`
- Subscript: `x_i`
- Fractions: `\frac{a}{b}`
- Summation: `\sum_{i=1}^{n}`
- Integration: `\int_{0}^{1}`
- Square root: `\sqrt{x}`
- Greek letters: `\alpha, \beta, \gamma`
- Sets: `\mathbb{Z}, \mathbb{R}, \mathbb{C}`
- Logic: `\forall, \exists, \land, \lor`

## Browser Compatibility

KaTeX works in all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

No JavaScript required for viewing rendered math!

## Development

To add or modify math rendering:

1. Edit `frontend/src/components/MathText.tsx`
2. Adjust regex patterns for different notation
3. Configure KaTeX options (display mode, macros, etc.)

Example custom configuration:

```typescript
katex.renderToString(math, {
  displayMode: true,
  throwOnError: false,
  macros: {
    "\\ZKP": "\\mathsf{ZKP}",
    "\\SNARK": "\\mathsf{SNARK}"
  }
});
```

## Future Enhancements

Potential improvements:
- [ ] Support for TikZ diagrams
- [ ] Chemical formulas (via mhchem)
- [ ] Copy formula as LaTeX
- [ ] Toggle between rendered and source view
- [ ] Custom macro definitions per paper
