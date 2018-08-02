# RKTA Sortable
Simple sortable for react with touch support and minimal side effects

## Example
```jsx
<ul>
  <Sortable
    emmiterProps={{ className: 'fade' }}
    ghostProps={{ className: 'boxShadow' }}
    moveRecipient={true}
    receiverProps={{ className: 'highlight' }}
    onSortComplete={(position, nextPosition) => console.log({ position, nextPosition })}
    onSortMove={currentPosition => console.log({ currentPosition })}
    refInterface="ref"
  >
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
  </Sortable>
</ul>
```

## Note
Sortable needs refs to the children DOM nodes. If you use HOC-decorated children,
then you need to implement custom ref handler prop in your HOC and pass it's
name as `refInterface`.

Sortable does not add any nodes to the DOM, except of the ghost element, which
is actually a copy of the pressed element.
