{#- Guide for table: replaces the generated examples on /docs/components/table/. Keep it in step with src/components/table.css and src/docs/examples.mjs. #}
## Example

Put the table in a `dsgn-table-wrap`. The wrapper scrolls sideways when the table is wider than the screen, so it is a focusable region with a name: keyboard users can scroll it too.

{% example "An invoice table with selection and sorting" %}
<div class="dsgn-table-wrap" tabindex="0" role="region" aria-label="Invoices">
  <table class="dsgn-table">
    <thead>
      <tr>
        <th scope="col" class="dsgn-table-select"><input type="checkbox" class="dsgn-checkbox" aria-label="Select all"></th>
        <th scope="col" aria-sort="ascending"><button class="dsgn-table-sort" type="button">Number<span class="dsgn-icon" aria-hidden="true">arrow_upward</span></button></th>
        <th scope="col">Client</th>
        <th scope="col"><button class="dsgn-table-sort" type="button">Due<span class="dsgn-icon" aria-hidden="true">unfold_more</span></button></th>
        <th scope="col" data-numeric>Amount (CZK)</th>
      </tr>
    </thead>
    <tbody>
      <tr aria-selected="true">
        <td class="dsgn-table-select"><input type="checkbox" class="dsgn-checkbox" aria-label="Select 2026-114" checked></td>
        <td>2026-114</td>
        <td>Studio Kolo s.r.o.</td>
        <td>12 Nov 2026</td>
        <td data-numeric>24 200</td>
      </tr>
      <tr>
        <td class="dsgn-table-select"><input type="checkbox" class="dsgn-checkbox" aria-label="Select 2026-115"></td>
        <td>2026-115</td>
        <td>Pekárna u Mlýna</td>
        <td>19 Nov 2026</td>
        <td data-numeric>8 650</td>
      </tr>
      <tr>
        <td class="dsgn-table-select"><input type="checkbox" class="dsgn-checkbox" aria-label="Select 2026-116"></td>
        <td>2026-116</td>
        <td>Novák Architects</td>
        <td>2 Dec 2026</td>
        <td data-numeric>132 000</td>
      </tr>
    </tbody>
  </table>
</div>
{% endexample %}

## Numbers

`data-numeric` on a header and its cells aligns them to the end. The whole table uses tabular figures, so digits line up from row to row.

## Sorting

A sortable header holds a `dsgn-table-sort` button with an icon: `unfold_more` while unsorted, `arrow_upward` or `arrow_downward` once sorted. Sorting is visual only: your code sorts the data and sets `aria-sort` on the `<th>`, which tells screen readers the order.

## Selection

A first column with `dsgn-table-select` holds a checkbox per row and one in the header to select all. Mark a selected row with `aria-selected="true"`, so it is highlighted and announced.

## Row height

A row is one control height plus a small gap above and below: 36 px in density S, 44 px in M and 52 px in L. A row with a checkbox, badge, link or ghost button keeps exactly that height, so a table never jumps when a row gets an action.

## Accessibility

- Give every header cell a `scope`: `col` for column headers, `row` for a header at the start of a row.
- Name the table: an `aria-label` on the wrapper, or a `<caption>` (which can be visually hidden).
- Every checkbox needs an `aria-label` that names its row.
