import { Children, cloneElement, Component } from 'react';
import { findDOMNode } from 'react-dom';
import PropTypes from 'prop-types';
import mergeProps from 'react-merge-props-and-styles';

import getPositionFromEvent from './getPositionFromEvent';

const NULL_INDEX = -1;

const defaultState = {
  activeElementIndex: NULL_INDEX,
  dragOverIndex: NULL_INDEX,
  screenX: 0,
  screenY: 0,
  fixX: 0,
  fixY: 0,
};

export default class Sortable extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    emmiterProps: PropTypes.shape(),
    ghostProps: PropTypes.shape(),
    onSortComplete: PropTypes.func,
    onSortMove: PropTypes.func,
    receiverProps: PropTypes.shape(),
  };
  static defaultProps = {
    emmiterProps: {},
    ghostProps: {},
    receiverProps: {},
    onSortComplete: () => null,
    onSortMove: () => null,
  }
  state = defaultState;
  componentDidMount() {
    this.isReallMounted = true;
    window.addEventListener('mousemove', this.handleDrag);
    window.addEventListener('pointerup', this.handleDragEnd);
  }
  componentWillUpdate(nextProps, { dragOverIndex }) {
    if (dragOverIndex !== this.state.dragOverIndex) this.props.onSortMove(dragOverIndex);
    this.itemRefs = this.nullRefs;
  }
  componentWillUnmount() {
    this.isReallMounted = false;
    window.removeEventListener('mousemove', this.handleDrag);
    window.addEventListener('pointerup', this.handleDragEnd);
  }
  get displayChildren() {
    return this.props.children;
  }
  get childrenArray() {
    return Children.toArray(this.props.children);
  }
  get ghost() {
    const {
      activeElementIndex,
      fixX,
      screenX,
      screenY,
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
        left: screenX - fixX,
        top: screenY - fixY,
        position: 'fixed',
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
    const { screenX, screenY } = getPositionFromEvent(event);
    const { x, y } = event.target.getBoundingClientRect();
    const fixX = screenX - x;
    const fixY = screenY - y;
    const enableDrag = () => {
      if (!this.isReallMounted) return;
      this.setState({
        activeElementIndex,
        screenX,
        screenY,
        fixX,
        fixY,
      });
    };
    this.dragTimeout = setTimeout(enableDrag, 128);
    event.stopPropagation();
  };
  makeRefHandler = key => (ref) => {
    if (ref) this.itemRefs[key] = findDOMNode(ref); // eslint-disable-line
  }
  handleDrag = (event) => {
    if (this.state.activeElementIndex === NULL_INDEX) return;
    const pointer = getPositionFromEvent(event);
    const intersect = (node) => {
      const { top, height } = node.getBoundingClientRect();
      const top2 = top + height;
      return top < pointer.clientY && pointer.clientY < top2;
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
    clearTimeout(this.dragTimeout);
  };
  cloneChild = (child, key) => {
    const { activeElementIndex, dragOverIndex } = this.state;
    const currentProps = {
      key,
      onDragStart: (event) => {
        event.preventDefault();
        return false;
      },
      onMouseDown: this.makeBeginHandler(key),
      onTouchStart: this.makeBeginHandler(key),
      onTouchEnd: this.handleDragEnd,
      onTouchCancel: this.handleDragEnd,
      onTouchMove: this.handleDrag,
      ref: this.makeRefHandler(key),
    };
    const emmiterProps = key === activeElementIndex
      || (dragOverIndex === NULL_INDEX && key === activeElementIndex)
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
