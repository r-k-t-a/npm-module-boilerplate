import { Children, cloneElement, Component } from 'react';
import { findDOMNode } from 'react-dom';
import PropTypes from 'prop-types';
import mergeProps from 'react-merge-props-and-styles';
import arrayMove from 'array-move';

import getPositionFromEvent from './getPositionFromEvent';

const NULL_INDEX = -1;

const defaultState = {
  activeElementIndex: NULL_INDEX,
  dragOverIndex: NULL_INDEX,
  pointerX: 0,
  pointerY: 0,
  fixX: 0,
  fixY: 0,
};

export default class Sortable extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    emmiterProps: PropTypes.shape(),
    ghostProps: PropTypes.shape(),
    moveRecipient: PropTypes.bool,
    onSortComplete: PropTypes.func,
    onSortMove: PropTypes.func,
    receiverProps: PropTypes.shape(),
  };
  static defaultProps = {
    emmiterProps: {},
    ghostProps: {},
    moveRecipient: true,
    receiverProps: {},
    onSortComplete: () => null,
    onSortMove: () => null,
  }
  state = defaultState;
  componentDidMount() {
    window.addEventListener('mousemove', this.handleDrag);
    window.addEventListener('pointerup', this.handleDragEnd);
  }
  componentWillUpdate(nextProps, { dragOverIndex }) {
    if (dragOverIndex !== this.state.dragOverIndex) this.props.onSortMove(dragOverIndex);
    this.itemRefs = this.nullRefs;
  }
  componentWillUnmount() {
    window.removeEventListener('mousemove', this.handleDrag);
    window.addEventListener('pointerup', this.handleDragEnd);
  }
  get displayChildren() {
    const { activeElementIndex, dragOverIndex } = this.state;
    const { children, moveRecipient } = this.props;
    if (
      activeElementIndex === NULL_INDEX ||
      dragOverIndex === NULL_INDEX ||
      !moveRecipient
    ) return children;
    return arrayMove(children, activeElementIndex, dragOverIndex);
  }
  get childrenArray() {
    return Children.toArray(this.props.children);
  }
  get ghost() {
    const {
      activeElementIndex,
      pointerX,
      fixX,
      pointerY,
      fixY,
    } = this.state;
    if (activeElementIndex === NULL_INDEX) return null;
    const activeChild = this.childrenArray[activeElementIndex];
    const activeRef = this.itemRefs[activeElementIndex];
    const currentProps = {
      key: 'rkta-sortable-ghost',
      style: {
        width: activeRef && activeRef.clientWidth,
        height: activeRef && activeRef.clientHeight,
        left: pointerX - fixX,
        top: pointerY - fixY,
        position: 'absolute',
      },
    };
    const nextProps = mergeProps(activeChild.props, currentProps, this.props.ghostProps);
    return cloneElement(activeChild, nextProps);
  }
  get nullRefs() {
    return this.childrenArray.map((child, key) => this.itemRefs[key] || NULL_INDEX);
  }
  itemRefs = [];
  makeBeginHandler = activeElementIndex => (event) => {
    const { pointerX, pointerY } = getPositionFromEvent(event);
    const { offsetLeft, offsetTop } = event.target;
    const fixX = pointerX - offsetLeft;
    const fixY = pointerY - offsetTop;
    this.setState({
      activeElementIndex,
      pointerX,
      pointerY,
      fixX,
      fixY,
    });
    event.stopPropagation();
  };
  makeRefHandler = key => (ref) => {
    if (ref) this.itemRefs[key] = findDOMNode(ref); // eslint-disable-line
  }
  handleDrag = (event) => {
    if (this.state.activeElementIndex === NULL_INDEX) return;
    const pointer = getPositionFromEvent(event);
    const intersect = (node) => {
      const y1 = node.offsetTop;
      const y2 = y1 + node.offsetHeight;
      return y1 < pointer.pointerY && pointer.pointerY < y2;
    };
    const dragOverIndex = this.itemRefs.findIndex(intersect);
    this.setState({ ...pointer, dragOverIndex });
    event.stopPropagation();
  }
  handleDragEnd = () => {
    const { activeElementIndex, dragOverIndex } = this.state;
    if (dragOverIndex !== NULL_INDEX && dragOverIndex !== activeElementIndex) {
      this.props.onSortComplete(activeElementIndex, dragOverIndex);
    }
    this.setState(defaultState);
  };
  cloneChild = (child, key) => {
    const { activeElementIndex, dragOverIndex } = this.state;
    const currentProps = {
      key,
      onPointerDown: this.makeBeginHandler(key),
      onTouchStart: this.makeBeginHandler(key),
      onTouchEnd: this.handleDragEnd,
      onTouchCancel: this.handleDragEnd,
      onTouchMove: this.handleDrag,
      ref: this.makeRefHandler(key),
    };
    const emmiterProps = key === dragOverIndex ||
      (dragOverIndex === NULL_INDEX && key === activeElementIndex)
      ? this.props.emmiterProps
      : {};
    const receiverProps = key === dragOverIndex && key !== activeElementIndex
      ? this.props.receiverProps
      : {};
    const nextProps = mergeProps(child.props, emmiterProps, receiverProps, currentProps);
    return cloneElement(child, nextProps);
  };
  render = () => Children.map(this.displayChildren, this.cloneChild).concat(this.ghost);
}
